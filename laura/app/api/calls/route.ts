import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { placeCall, sendText } from "@/lib/twilio";

export async function GET() {
  const logs = await prisma.callLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ logs });
}

const KINDS = new Set(["call", "sms"]);

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const kind = KINDS.has(data?.kind) ? (data.kind as "call" | "sms") : null;
  const message = typeof data?.message === "string" ? data.message.trim() : "";

  if (!kind) {
    return NextResponse.json({ error: "kind must be 'call' or 'sms'." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  try {
    const result = kind === "call" ? await placeCall(message) : await sendText(message);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, sid: result.sid }, { status: 201 });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error }, { status: 500 });
  }
}
