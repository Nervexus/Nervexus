import { createHash, timingSafeEqual } from "node:crypto";

// The HQ link between LAURA and the outreach app (Signal Outreach). Both
// sides share LAURA_LINK_SECRET and send it as a Bearer token. Only
// outreach activity crosses the link -- never the Vault or credentials.

export const OUTREACH_URL = (process.env.OUTREACH_URL || "https://signal-outreach-two.vercel.app").replace(/\/+$/, "");

function secret(): string | null {
  return process.env.LAURA_LINK_SECRET?.trim() || null;
}

/** True when a request to one of LAURA's /api/hq routes carries the secret. */
export function hqAuthorized(request: Request): boolean {
  const s = secret();
  const header = request.headers.get("authorization") ?? "";
  if (!s || !header.startsWith("Bearer ")) return false;
  const a = createHash("sha256").update(header.slice(7).trim()).digest();
  const b = createHash("sha256").update(s).digest();
  return timingSafeEqual(a, b);
}

export class OutreachError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Calls the outreach app's /api/hq routes. Throws OutreachError with a
 * plain message on failure so callers (Laura's tools) can say what went wrong. */
export async function outreach<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const s = secret();
  if (!s) throw new OutreachError("The outreach link isn't set up yet (LAURA_LINK_SECRET is missing).", 503);
  let res: Response;
  try {
    res = await fetch(`${OUTREACH_URL}/api/hq${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${s}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch {
    throw new OutreachError("Couldn't reach the outreach app.", 504);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data && typeof data.error === "string" && data.error) || `Outreach app returned ${res.status}.`;
    throw new OutreachError(msg, res.status);
  }
  return data as T;
}

export type OutreachStats = {
  today: { sent: number; replies: number };
  week: { sent: number; replies: number; callsBooked: number; won: number };
  warmLeads: { id: string | number; name: string; company: string | null; lastReplyAt: string | null }[];
};

/** Stats for summaries; null (never throws) if the link is down or unset. */
export async function outreachStatsOrNull(): Promise<OutreachStats | null> {
  try {
    return await outreach<OutreachStats>("/stats");
  } catch {
    return null;
  }
}
