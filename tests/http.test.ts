import { describe, expect, it } from "vitest";
import { readRequestBody } from "../src/lib/http";

describe("request boundaries", () => {
  it("accepts same-origin browser requests when Next normalizes the internal URL hostname", async () => {
    const request = new Request("http://localhost:3100/api/chat", {
      method: "POST",
      headers: {
        host: "127.0.0.1:3100",
        origin: "http://127.0.0.1:3100",
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "hello" }),
    });
    await expect(readRequestBody(request)).resolves.toEqual({
      message: "hello",
    });
  });
  it("rejects foreign origins and malformed JSON", async () => {
    await expect(
      readRequestBody(
        new Request("http://localhost/api/chat", {
          method: "POST",
          headers: {
            origin: "https://foreign.example",
            "content-type": "application/json",
          },
          body: "{}",
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      readRequestBody(
        new Request("http://localhost/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{invalid",
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("bounds streamed bodies even without a Content-Length header", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "x".repeat(128001),
    });
    await expect(readRequestBody(request)).rejects.toMatchObject({
      status: 413,
    });
  });
});
