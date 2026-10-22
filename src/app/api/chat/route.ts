import OpenAI from "openai";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { chatRequestSchema } from "@/lib/schema";
import { scriptedReply } from "@/lib/scripted";
import { runLiveAssistant } from "@/lib/live";
import { InputError, readRequestBody } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 35;
const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  try {
    const body = chatRequestSchema.parse(await readRequestBody(request));
    if (body.mode === "scripted")
      return NextResponse.json(
        scriptedReply(body.message, body.events, body.timeZone),
        { headers },
      );
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey)
      return NextResponse.json(
        {
          error:
            "Live AI is not configured. Add OPENAI_API_KEY on the server, or choose Scripted demo.",
          code: "AI_UNAVAILABLE",
        },
        { status: 503, headers },
      );
    const signal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(30_000),
    ]);
    const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 30_000 });
    const reply = await runLiveAssistant(
      body,
      (params, abortSignal) =>
        client.responses.create(params, { signal: abortSignal }),
      process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
      signal,
    );
    return NextResponse.json(reply, { headers });
  } catch (error) {
    if (error instanceof InputError)
      return NextResponse.json(
        { error: error.message, code: "INVALID_INPUT" },
        { status: error.status, headers },
      );
    if (error instanceof ZodError)
      return NextResponse.json(
        {
          error:
            "Some demo data is invalid or too long. Reset the demo or shorten your message, then try again.",
          code: "INVALID_INPUT",
        },
        { status: 400, headers },
      );
    return NextResponse.json(
      {
        error:
          "Live AI could not complete this request. Nothing was sent. Retry, or explicitly choose Scripted demo.",
        code: "AI_UNAVAILABLE",
      },
      { status: 503, headers },
    );
  }
}
