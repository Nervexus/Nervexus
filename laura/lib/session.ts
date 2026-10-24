import { createHash, createHmac, timingSafeEqual } from "crypto";

// One-password sign-in for a single-user app. The session cookie is
// "<expiry ms>.<hmac>", signed with the server-only TOKEN_ENCRYPTION_KEY,
// so it can't be forged or extended without that key, and there's no
// session table to look up.
export const SESSION_COOKIE = "laura_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30;

function key(): string {
  const k = process.env.TOKEN_ENCRYPTION_KEY;
  if (!k) throw new Error("TOKEN_ENCRYPTION_KEY is not set.");
  return k;
}

function sign(payload: string): string {
  return createHmac("sha256", key()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function passwordMatches(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

export function createSessionValue(now = Date.now()): string {
  const expires = String(now + SESSION_MAX_AGE_S * 1000);
  return `${expires}.${sign(expires)}`;
}

export function isValidSession(value: string | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const [expires, mac] = value.split(".");
  if (!expires || !mac || Number(expires) < now) return false;
  return safeEqual(mac, sign(expires));
}
