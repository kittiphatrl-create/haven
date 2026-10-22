import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json(
    { liveConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
