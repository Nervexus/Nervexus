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

// A server-side backup credential (env var, never in the repo). It signs in
// the same as the main password and also works when Face ID is otherwise
// required, so a lost or broken phone can't lock the owner out. Absent by
// default, in which case nothing changes.
export function recoveryMatches(candidate: string): boolean {
  const expected = process.env.RECOVERY_PASSWORD;
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

// A short-lived signed value for the WebAuthn challenge between the
// "options" and "verify" steps -- "<challenge>.<expiry>.<hmac>", 5 minutes.
export const CHALLENGE_COOKIE = "laura_pk_challenge";

export function sealChallenge(challenge: string, now = Date.now()): string {
  const payload = `${challenge}.${now + 5 * 60 * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export function openChallenge(value: string | undefined, now = Date.now()): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [challenge, expires, mac] = parts;
  if (Number(expires) < now || !safeEqual(mac, sign(`${challenge}.${expires}`))) return null;
  return challenge;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_S,
};
