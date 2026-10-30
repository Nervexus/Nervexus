import { NextResponse } from "next/server";

const WEBHOOK_PATH = "/api/telegram/webhook";

function botToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

/** GET — show the current webhook state. */
export async function GET() {
  const token = botToken();
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const data = await res.json();
  return NextResponse.json(data.result ?? data);
}

/** POST — register (or re-register) the webhook with Telegram. */
export async function POST() {
  const token = botToken();
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "TELEGRAM_WEBHOOK_SECRET not set" }, { status: 500 });

  let baseUrl = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!baseUrl) return NextResponse.json({ error: "No base URL configured (NEXT_PUBLIC_URL or VERCEL_PROJECT_PRODUCTION_URL)" }, { status: 500 });
  if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;

  const url = `${baseUrl.replace(/\/$/, "")}${WEBHOOK_PATH}`;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    }),
  });

  const data = await res.json();
  return NextResponse.json({ ok: data.ok, description: data.description, webhook_url: url });
}

/** DELETE — remove the webhook (stops Telegram from sending updates). */
export async function DELETE() {
  const token = botToken();
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

  const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: "POST" });
  const data = await res.json();
  return NextResponse.json({ ok: data.ok, description: data.description });
}
