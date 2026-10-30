import { NextResponse } from "next/server";
import { OUTREACH_URL, outreachStatsOrNull, type OutreachStats } from "@/lib/hq";
import { prisma } from "@/lib/db";

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
  const tgSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  let tgStatus: "online" | "offline" | "unconfigured" = "unconfigured";
  let webhookConnected = false;
  if (tgToken) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${tgToken}/getMe`, { signal: AbortSignal.timeout(4000) });
      tgStatus = res.ok ? "online" : "offline";
    } catch {
      tgStatus = "offline";
    }

    // Auto-register webhook if not set
    if (tgStatus === "online" && tgSecret) {
      try {
        const info = await fetch(`https://api.telegram.org/bot${tgToken}/getWebhookInfo`, { signal: AbortSignal.timeout(4000) }).then(r => r.json());
        let baseUrl = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
        if (baseUrl && !baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;
        const expectedUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook` : null;

        if (info.result?.url === expectedUrl) {
          webhookConnected = true;
        } else if (expectedUrl) {
          const reg = await fetch(`https://api.telegram.org/bot${tgToken}/setWebhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: expectedUrl,
              secret_token: tgSecret,
              allowed_updates: ["message", "callback_query"],
            }),
          }).then(r => r.json());
          webhookConnected = reg.ok === true;
        }
      } catch {}
    }
  }
  nodes.push({
    id: "telegram",
    name: "Telegram",
    url: null,
    status: tgStatus,
    stats: { webhookConnected },
  });

  // Vercel (always online if the app is running)
  nodes.push({
    id: "vercel",
    name: "Vercel",
    url: "https://laura-lyart.vercel.app",
    status: "online",
  });

  // Database (Turso) — quick health check
  let dbStatus: "online" | "offline" = "offline";
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbStatus = "online";
  } catch {
    dbStatus = "offline";
  }
  nodes.push({
    id: "database",
    name: "Database",
    url: null,
    status: dbStatus,
  });

  return NextResponse.json({ nodes });
}
