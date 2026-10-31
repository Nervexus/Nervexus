import { NextResponse, connection } from "next/server";

type Status = "connected" | "expiring" | "missing";

function tursoTokenExpiry(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof claims.exp === "number" ? new Date(claims.exp * 1000).toISOString() : null;
  } catch {
    return null;
  }
}

// Reads presence/shape only -- never the actual secret values -- so this
// route is safe to expose to the Settings page without leaking anything.
export async function GET() {
  // Opts into per-request rendering under Cache Components: without this,
  // Next statically evaluates the route at build time, freezing the
  // Date.now()-based "expires soon" check forever instead of recomputing
  // it on every request.
  await connection();

  const tursoExpiresAt = tursoTokenExpiry(process.env.TURSO_AUTH_TOKEN);
  const tursoExpiringSoon = tursoExpiresAt
    ? new Date(tursoExpiresAt).getTime() - Date.now() < 48 * 60 * 60 * 1000
    : false;

  const tursoStatus: Status = !process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN
    ? "missing"
    : tursoExpiringSoon
      ? "expiring"
      : "connected";

  const items: {
    key: string;
    label: string;
    status: Status;
    detail: string | null;
  }[] = [
    {
      key: "gemini",
      label: "Gemini API key",
      status: process.env.GEMINI_API_KEY ? "connected" : "missing",
      detail: "Core brain, vision, and web search",
    },
    {
      key: "turso",
      label: "Turso database",
      status: tursoStatus,
      detail: tursoExpiresAt ? `Token expires ${new Date(tursoExpiresAt).toLocaleString()}` : "Notes, reminders, rota, bookings, content, vault",
    },
    {
      key: "encryptionKey",
      label: "Vault encryption key",
      status: process.env.TOKEN_ENCRYPTION_KEY ? "connected" : "missing",
      detail: "Encrypts Vault entries at rest",
    },
    {
      key: "telegram",
      label: "Telegram bot",
      status: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID ? "connected" : "missing",
      detail: "Powers call_me and text_me",
    },
    {
      key: "cronSecret",
      label: "Daily briefing cron",
      status: process.env.CRON_SECRET ? "connected" : "missing",
      detail: "Secures the unprompted tomorrow-briefing job",
    },
    {
      key: "instagram",
      label: "Instagram Graph API",
      status: "missing",
      detail: "Not wired in yet -- real analytics and posting",
    },
    {
      key: "maps",
      label: "Google Maps / transit API",
      status: "missing",
      detail: "Not wired in yet -- commute planning uses web search instead",
    },
    {
      key: "calendar",
      label: "Google Calendar / Gmail",
      status: "missing",
      detail: "Not built yet",
    },
  ];

  return NextResponse.json({ items });
}
