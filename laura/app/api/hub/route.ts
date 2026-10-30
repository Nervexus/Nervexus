import { NextResponse } from "next/server";
import { OUTREACH_URL, outreachStatsOrNull, type OutreachStats } from "@/lib/hq";

type SystemNode = {
  id: string;
  name: string;
  url: string | null;
  status: "online" | "offline" | "unconfigured";
  stats?: Record<string, unknown>;
};

export async function GET() {
  const nodes: SystemNode[] = [];

  // Encrypted (Signal Outreach)
  const outreachStats: OutreachStats | null = await outreachStatsOrNull();
  nodes.push({
    id: "encrypted",
    name: "Encrypted",
    url: OUTREACH_URL,
    status: outreachStats ? "online" : process.env.LAURA_LINK_SECRET ? "offline" : "unconfigured",
    stats: outreachStats
      ? {
          sentToday: outreachStats.today.sent,
          repliesToday: outreachStats.today.replies,
          weekSent: outreachStats.week.sent,
          weekReplies: outreachStats.week.replies,
          callsBooked: outreachStats.week.callsBooked,
          warmLeads: outreachStats.warmLeads.length,
        }
      : undefined,
  });

  // Telegram bot
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  let tgStatus: "online" | "offline" | "unconfigured" = "unconfigured";
  if (tgToken) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${tgToken}/getMe`, { signal: AbortSignal.timeout(4000) });
      tgStatus = res.ok ? "online" : "offline";
    } catch {
      tgStatus = "offline";
    }
  }
  nodes.push({
    id: "telegram",
    name: "Telegram",
    url: null,
    status: tgStatus,
  });

  return NextResponse.json({ nodes });
}
