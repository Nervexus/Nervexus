import { NextRequest, NextResponse } from "next/server";
import { runDailyMessages } from "@/lib/daily";
import { sendDueReminders } from "@/lib/reminder-pings";
import { syncApiIssues } from "@/lib/api-issues";

// Vercel's two daily crons (vercel.json) -- a fallback for the scheduler
// that calls /api/routine/tick. Same rules: each text at most once a day,
// only when it's due by the times in Settings.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const reminders = await sendDueReminders().catch((err) => {
      console.error("reminder pings failed:", err);
      return { sent: 0, failed: -1 };
    });
    return NextResponse.json({ ...(await runDailyMessages()), reminders });
  } catch (err) {
    console.error("routine send failed:", err);
    return NextResponse.json({ error: "Couldn't send." }, { status: 500 });
  } finally {
    await syncApiIssues().catch((err) => console.error("API issue sync failed:", err));
  }
}
