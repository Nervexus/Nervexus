import { NextRequest, NextResponse } from "next/server";
import { runDailyMessages } from "@/lib/daily";
import { syncApiIssues } from "@/lib/api-issues";

// Hit every 5-10 minutes by an external scheduler (cron-job.org), with
// "Authorization: Bearer <CRON_SECRET>". Sends the morning/night texts
// when they're due (see lib/daily.ts).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await runDailyMessages());
  } catch (err) {
    console.error("routine tick failed:", err);
    return NextResponse.json({ error: "Tick failed." }, { status: 500 });
  } finally {
    await syncApiIssues().catch((err) => console.error("API issue sync failed:", err));
  }
}
