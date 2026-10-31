import { NextRequest, NextResponse } from "next/server";
import { getTomorrowBriefing } from "@/lib/briefing";
import { sendText } from "@/lib/telegram";
import { syncApiIssues } from "@/lib/api-issues";

// Vercel Cron calls this on a schedule (see vercel.json) to push tomorrow's
// briefing without the user having to ask. Gated on CRON_SECRET so this
// can't be triggered by anyone who finds the URL -- Vercel sends it as
// `Authorization: Bearer <CRON_SECRET>` automatically when the env var is
// set, so there's nothing extra to configure on the Vercel side.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const briefing = await getTomorrowBriefing();
    if (!briefing.shift && briefing.reminders.length === 0) {
      return NextResponse.json({ sent: false, reason: "nothing on tomorrow" });
    }
    const result = await sendText(`📋 *Tomorrow:*\n${briefing.summary}`);
    if (!result.ok) return NextResponse.json({ sent: false, error: result.error }, { status: 502 });
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("GET /api/briefing/send failed:", err);
    return NextResponse.json({ error: "Couldn't send tomorrow's briefing." }, { status: 500 });
  } finally {
    await syncApiIssues().catch((err) => console.error("API issue sync failed:", err));
  }
}
