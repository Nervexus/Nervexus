import { NextResponse } from "next/server";

// Internal-only endpoint that registers the Telegram webhook. Runs
// server-side so it has access to all env vars. Auth is handled by the
// proxy (requires a valid session cookie).

export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  if (!secret) return NextResponse.json({ error: "TELEGRAM_WEBHOOK_SECRET not set" }, { status: 500 });

  let baseUrl = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!baseUrl) return NextResponse.json({ error: "No base URL configured" }, { status: 500 });
  if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;
  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    }),
  });
  const data = await res.json();
  return NextResponse.json({ ok: data.ok, description: data.description, webhook_url: webhookUrl });
}

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

  const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const data = await res.json();
  return NextResponse.json(data.result ?? data);
}
