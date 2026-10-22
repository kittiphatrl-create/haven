import { describe, expect, it } from "vitest";
import { runLiveAssistant, type ResponseRunner } from "../src/lib/live";
import { createEvent } from "../src/lib/demo";
import type { ChatRequest } from "../src/lib/schema";

const request: ChatRequest = {
  message: "Help me check in with someone at home.",
  mode: "live",
  events: [createEvent("doorbell")],
  history: [],
  timeZone: "UTC",
};
const call = (name: string, args: object) => ({
  type: "function_call" as const,
  id: crypto.randomUUID(),
  call_id: crypto.randomUUID(),
  name,
  arguments: JSON.stringify(args),
});
const result = (output: ReturnType<typeof call>[] = [], output_text = "") => ({
  output,
  output_text,
  status: "completed" as const,
});

describe("bounded live tool orchestration (fake provider, no API calls)", () => {
  it("requires an event read, supplies the current snapshot, and only stages a draft", async () => {
    const seen: Parameters<ResponseRunner>[0][] = [];
    const responses = [
      result([call("get_recent_events", { limit: 100 })]),
      result([
        call("draft_check_in", {
          recipient: "Household member",
          message: "Hi, how is your day?",
        }),
      ]),
      result([], "Please review your draft. Nothing has been sent."),
    ];
    const runner: ResponseRunner = async (input) => {
      seen.push(structuredClone(input));
      return responses.shift()!;
    };
    const reply = await runLiveAssistant(
      request,
      runner,
      "test-model",
      new AbortController().signal,
    );
    expect(seen[0].tool_choice).toEqual({
      type: "function",
      name: "get_recent_events",
    });
    expect(JSON.stringify(seen[1].input)).toContain(request.events[0].id);
    expect(reply.draft?.status).toBe("draft");
    expect(reply.activity).toEqual([
      "Read 1 recent event",
      "Prepared a check-in draft",
    ]);
    expect(seen.every((params) => params.store === false)).toBe(true);
    expect(JSON.stringify(seen[0].tools)).not.toContain("send_message");
  });
  it("stops after four provider requests even if tools keep being requested", async () => {
    let count = 0;
    const runner: ResponseRunner = async () => {
      count++;
      return result([call("get_recent_events", { limit: 100 })]);
    };
    await expect(
      runLiveAssistant(
        request,
        runner,
        "test-model",
        new AbortController().signal,
      ),
    ).rejects.toThrow();
    expect(count).toBe(4);
  });
  it("rejects malformed tool arguments and unknown/send tools", async () => {
    for (const tool of [
      call("get_recent_events", { limit: 999 }),
      call("send_message", {}),
      call("draft_check_in", { recipient: "Anyone", message: "" }),
    ]) {
      const runner: ResponseRunner = async () => result([tool]);
      await expect(
        runLiveAssistant(
          request,
          runner,
          "test-model",
          new AbortController().signal,
        ),
      ).rejects.toThrow();
    }
  });
  it("refuses a final answer before events have been read", async () => {
    await expect(
      runLiveAssistant(
        request,
        async () => result([], "Everyone is safe"),
        "test-model",
        new AbortController().signal,
      ),
    ).rejects.toThrow();
  });
  it("does not switch to scripted responses on provider failure", async () => {
    await expect(
      runLiveAssistant(
        request,
        async () => {
          throw new Error("Provider unavailable");
        },
        "test-model",
        new AbortController().signal,
      ),
    ).rejects.toThrow("Provider unavailable");
  });
  it("honors cancellation before a provider call", async () => {
    const controller = new AbortController();
    controller.abort();
    let count = 0;
    await expect(
      runLiveAssistant(
        request,
        async () => {
          count++;
          return result();
        },
        "test-model",
        controller.signal,
      ),
    ).rejects.toThrow();
    expect(count).toBe(0);
  });
});
