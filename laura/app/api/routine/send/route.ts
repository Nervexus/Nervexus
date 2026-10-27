import { NextRequest, NextResponse } from "next/server";
import { morningMessage, nightMessage } from "@/lib/routine";
import { replyInChat } from "@/lib/telegram";

// Vercel Cron calls this twice a day (see vercel.json): ?part=morning for
// the morning summary, ?part=night for the night checklist (which also
// covers tomorrow's shift and dates). Gated on CRON_SECRET, which Vercel
// sends as a Bearer token automatically.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const part = request.nextUrl.searchParams.get("part");
  if (part !== "morning" && part !== "night") {
    return NextResponse.json({ error: "part must be morning or night" }, { status: 400 });
  }
  try {
    const sent = await replyInChat(part === "morning" ? await morningMessage() : await nightMessage());
    return NextResponse.json({ sent }, { status: sent ? 200 : 502 });
  } catch (err) {
    console.error(`routine ${part} send failed:`, err);
    return NextResponse.json({ error: "Couldn't send." }, { status: 500 });
  }
}
