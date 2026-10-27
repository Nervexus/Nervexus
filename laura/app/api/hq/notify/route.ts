import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hqAuthorized } from "@/lib/hq";
import { replyInChat } from "@/lib/telegram";

// The outreach app asks LAURA to text Madoxs (hot replies only).
export async function POST(request: Request) {
  if (!hqAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.json().catch(() => null);
  const text = typeof data?.text === "string" ? data.text.trim().slice(0, 1500) : "";
  if (!text) return NextResponse.json({ error: "text is required." }, { status: 400 });
  try {
    if (!(await replyInChat(`📨 Outreach\n${text}`))) {
      return NextResponse.json({ error: "Telegram didn't accept the message." }, { status: 502 });
    }
    await prisma.activityLog.create({ data: { tool: "outreach", summary: "Outreach alert sent to Telegram" } }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("hq notify failed:", err);
    return NextResponse.json({ error: "Couldn't send the Telegram message." }, { status: 502 });
  }
}
