import { NextResponse } from "next/server";

// One-shot registration endpoint. Protected by a single-use nonce passed
// as a query param that must match TELEGRAM_WEBHOOK_SECRET. This runs
// server-side so it has access to all env vars.
//
// Alternatively, called via Vercel Cron header (CRON_SECRET) so we can
// wire it into vercel.json for auto-registration on deploy.

export async function GET(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!token || !secret) {
    return NextResponse.json({ error: "Telegram env vars not set" }, { status: 500 });
  }

  // Auth: either the cron secret header or the webhook secret as query param
  const url = new URL(request.url);
  const cronSecret = request.headers.get("x-vercel-cron-secret") ?? request.headers.get("authorization")?.replace("Bearer ", "");
  const querySecret = url.searchParams.get("secret");
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;
  const isSecretMatch = querySecret && querySecret === secret;

  if (!isCron && !isSecretMatch) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let baseUrl = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!baseUrl) return NextResponse.json({ error: "No base URL" }, { status: 500 });
  if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;
  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;

  // Check current webhook first
  const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const info = await infoRes.json();
  if (info.result?.url === webhookUrl) {
    return NextResponse.json({ ok: true, status: "already_registered", webhook_url: webhookUrl, pending: info.result.pending_update_count });
  }

  // Register
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
