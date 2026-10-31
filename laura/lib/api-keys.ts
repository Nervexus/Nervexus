import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";
import { decrypt, encrypt, type EncryptedValue } from "@/lib/crypto";

// Each service can hold several keys. The first usable one (by priority) is
// used; when it's rejected, rate-limited or used up it's marked with a status
// (and when that lifts) and the next usable key takes over in the same call.
// The key set in Vercel is imported as "Main key" and can't be removed here.

export const KEY_SERVICES = {
  gemini: {
    label: "Gemini",
    env: "GEMINI_API_KEY",
    what: "Laura's brain: chat, vision, voice notes and web search.",
    limits: "Free keys have per-minute and daily request limits. Daily limits reset at midnight Pacific time (8am UK).",
    how: [
      "Go to aistudio.google.com/apikey and sign in with a Google account",
      "Press Create API key (pick or create a Google Cloud project if asked)",
      "Copy the key and paste it here",
    ],
  },
} as const;

export type KeyService = keyof typeof KEY_SERVICES;
export type KeyStatus = "ok" | "limited" | "exhausted" | "invalid";
export type TestResult = { ok: boolean; status: KeyStatus | "error"; message: string; until?: Date | null };

// Outside services without keys that still matter when they're down.
export const CONNECTIONS: Record<string, { label: string; fix: string }> = {
  telegram: {
    label: "Telegram",
    fix: "Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Vercel, then reconnect from the System page.",
  },
};

export function isKeyService(value: unknown): value is KeyService {
  return typeof value === "string" && value in KEY_SERVICES;
}

export function sealKey(plain: string): string {
  return JSON.stringify(encrypt(plain));
}

export function openKey(stored: string): string {
  return decrypt(JSON.parse(stored) as EncryptedValue);
}

export function mask(plain: string): string {
  return plain.length > 10 ? `${plain.slice(0, 4)}…${plain.slice(-4)}` : "…";
}

export class NoWorkingKeyError extends Error {
  constructor(service: KeyService) {
    super(`${KEY_SERVICES[service].label} has no working API key. Add one in Settings → API keys.`);
    this.name = "NoWorkingKeyError";
  }
}

type Row = Awaited<ReturnType<typeof prisma.apiKey.findMany>>[number];
export type LoadedKey = Row & { secret: string | null; fromEnv: boolean };

// ------------------------------------------------------------------ loading

/** The key set in Vercel joins the list as "Main key" the first time it's seen. */
async function ensureEnvKey(service: KeyService, rows: LoadedKey[]): Promise<boolean> {
  const env = process.env[KEY_SERVICES[service].env]?.trim();
  if (!env || rows.some((r) => r.secret === env)) return false;
  const first = rows.reduce((min, r) => Math.min(min, r.priority), 1);
  await prisma.apiKey.create({ data: { service, label: "Main key", apiKey: sealKey(env), priority: first - 1 } });
  return true;
}

export async function loadKeys(service: KeyService): Promise<LoadedKey[]> {
  const read = async () => {
    const rows = await prisma.apiKey.findMany({ where: { service }, orderBy: [{ priority: "asc" }, { createdAt: "asc" }] });
    const env = process.env[KEY_SERVICES[service].env]?.trim();
    return rows.map((r) => {
      let secret: string | null = null;
      try {
        secret = openKey(r.apiKey);
      } catch {
        // unreadable (encryption key changed): shown as rejected below
      }
      return { ...r, secret, fromEnv: !!env && secret === env };
    });
  };
  const rows = await read();
  return (await ensureEnvKey(service, rows)) ? read() : rows;
}

/** Usable now? A limited/exhausted key whose wait has passed flips back to ok. */
async function usable(k: LoadedKey, now = new Date()): Promise<boolean> {
  if (!k.secret) return false;
  if (k.status === "ok") return true;
  if ((k.status === "limited" || k.status === "exhausted") && k.until && k.until <= now) {
    await prisma.apiKey.update({ where: { id: k.id }, data: { status: "ok", until: null, error: null } });
    Object.assign(k, { status: "ok", until: null, error: null });
    return true;
  }
  return false;
}

export async function usableKeys(keys: LoadedKey[]): Promise<LoadedKey[]> {
  const out: LoadedKey[] = [];
  for (const k of keys) if (await usable(k)) out.push(k);
  return out;
}

export function nextReset(keys: LoadedKey[]): Date | null {
  const times = keys
    .filter((k) => k.status === "limited" || k.status === "exhausted")
    .map((k) => k.until)
    .filter((t): t is Date => !!t);
  return times.length ? new Date(Math.min(...times.map((t) => t.getTime()))) : null;
}

// ------------------------------------------------------------------ health

export async function recordHealthOk(service: string) {
  await prisma.serviceHealth.upsert({
    where: { service },
    create: { service, lastOk: new Date() },
    update: { lastOk: new Date(), fails: 0, cooldownUntil: null },
  });
}

/** From the 2nd failure in a row the service cools down: 10, 20, 40… minutes, max 4 hours. */
export async function recordHealthFail(service: string, error: string) {
  const prev = await prisma.serviceHealth.findUnique({ where: { service } });
  const fails = (prev?.fails ?? 0) + 1;
  const cooldownUntil = fails >= 2 ? new Date(Date.now() + Math.min(240, 10 * 2 ** (fails - 2)) * 60_000) : null;
  const data = { fails, error: error.slice(0, 240), lastError: new Date(), cooldownUntil };
  await prisma.serviceHealth.upsert({ where: { service }, create: { service, ...data }, update: data });
}

/** Health writes must never break the call they're reporting on. */
export function quietly(p: Promise<unknown>) {
  return p.catch((err) => console.error("health/key bookkeeping failed:", err));
}

// ------------------------------------------------------------------ errors

function nextPacificMidnight(): Date {
  const now = new Date();
  const pt = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const offset = now.getTime() - pt.getTime();
  const midnight = new Date(pt);
  midnight.setHours(24, 0, 5, 0);
  return new Date(midnight.getTime() + offset);
}

type Classified =
  | { kind: "invalid" | "limited" | "exhausted"; until: Date | null; message: string }
  | { kind: "network"; message: string }
  | { kind: "other" };

/** Is this the key's fault (mark it, try the next), the service's (health), or the request's (rethrow)? */
export function classifyGeminiError(err: unknown): Classified {
  const status = (err as { status?: number }).status;
  const text = err instanceof Error ? err.message : String(err);
  if (status === 401 || status === 403 || (status === 400 && /api key/i.test(text))) {
    return { kind: "invalid", until: null, message: "Rejected by Google. It may have been deleted or mistyped." };
  }
  if (status === 429 || /RESOURCE_EXHAUSTED|rate limit|quota/i.test(text)) {
    if (/PerDay|per day|daily/i.test(text)) {
      return { kind: "exhausted", until: nextPacificMidnight(), message: "Daily limit used up." };
    }
    if (/billing|credit/i.test(text)) {
      return { kind: "exhausted", until: new Date(Date.now() + 24 * 3600_000), message: "Out of credit or billing problem." };
    }
    const delay = Number(/retryDelay"?:\s*"?(\d+)/.exec(text)?.[1] ?? 60);
    return { kind: "limited", until: new Date(Date.now() + Math.max(30, delay) * 1000), message: "Rate-limited for a moment." };
  }
  if (!status || status >= 500 || /fetch failed|ECONN|ETIMEDOUT|timeout|network/i.test(text)) {
    return { kind: "network", message: text.slice(0, 200) };
  }
  return { kind: "other" };
}

// ------------------------------------------------------------------ using a key

/** Runs a provider call with the first usable key, failing over to the next on key errors. */
export async function withKey<T>(service: KeyService, call: (secret: string) => Promise<T>): Promise<T> {
  let keys: LoadedKey[];
  try {
    keys = await loadKeys(service);
  } catch (err) {
    // database unreachable or not migrated yet: the Vercel key alone still works
    console.error("Couldn't load API keys, using the Vercel key:", err);
    const env = process.env[KEY_SERVICES[service].env];
    if (!env) throw new NoWorkingKeyError(service);
    return call(env);
  }

  const tried = new Set<string>();
  for (;;) {
    const key = (await usableKeys(keys)).find((k) => !tried.has(k.id));
    if (!key) {
      await quietly(recordHealthFail(service, "No working key"));
      await quietly(syncIssues());
      throw new NoWorkingKeyError(service);
    }
    tried.add(key.id);
    try {
      const out = await call(key.secret!);
      await quietly(
        Promise.all([
          prisma.apiKey.update({ where: { id: key.id }, data: { lastUsed: new Date(), uses: { increment: 1 } } }),
          recordHealthOk(service),
        ])
      );
      return out;
    } catch (err) {
      const c = classifyGeminiError(err);
      if (c.kind === "other") throw err;
      if (c.kind === "network") {
        await quietly(recordHealthFail(service, c.message));
        throw err;
      }
      await quietly(prisma.apiKey.update({ where: { id: key.id }, data: { status: c.kind, until: c.until, error: c.message } }));
      Object.assign(key, { status: c.kind, until: c.until, error: c.message });
      await quietly(syncIssues());
    }
  }
}

// Imported lazily: api-issues imports this file too.
async function syncIssues() {
  const { syncApiIssues } = await import("@/lib/api-issues");
  await syncApiIssues();
}

// ------------------------------------------------------------------ testing and managing

export async function testKey(service: KeyService, secret: string): Promise<TestResult> {
  if (service === "gemini") {
    try {
      // A real one-token request, so a used-up daily quota shows up too.
      await new GoogleGenAI({ apiKey: secret }).models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: "ok",
        config: { maxOutputTokens: 1 },
      });
      return { ok: true, status: "ok", message: "Working" };
    } catch (err) {
      const c = classifyGeminiError(err);
      if (c.kind === "invalid" || c.kind === "limited" || c.kind === "exhausted") {
        return { ok: false, status: c.kind, message: c.message, until: c.until };
      }
      // Any other answer from Google still proves the key was accepted.
      if (c.kind === "other") return { ok: true, status: "ok", message: "Working" };
      return { ok: false, status: "error", message: "Couldn't reach Google. Try again." };
    }
  }
  return { ok: false, status: "error", message: "Unknown service" };
}

/** Tests a stored key and saves the result on it. */
export async function testStoredKey(id: string): Promise<TestResult> {
  const row = await prisma.apiKey.findUnique({ where: { id } });
  if (!row || !isKeyService(row.service)) return { ok: false, status: "error", message: "Key not found" };
  let secret: string;
  try {
    secret = openKey(row.apiKey);
  } catch {
    return { ok: false, status: "invalid", message: "Couldn't decrypt this key. Remove it and add it again." };
  }
  const res = await testKey(row.service, secret);
  if (res.status !== "error") {
    await prisma.apiKey.update({
      where: { id },
      data: { status: res.status, until: res.until ?? null, error: res.ok ? null : res.message },
    });
  }
  return res;
}

export async function addKey(service: KeyService, plain: string, label?: string): Promise<{ id: string; result: TestResult }> {
  const keys = await loadKeys(service);
  const existing = keys.find((k) => k.secret === plain);
  if (existing) return { id: existing.id, result: await testStoredKey(existing.id) };
  const priority = keys.reduce((max, k) => Math.max(max, k.priority), 0) + 1;
  const row = await prisma.apiKey.create({
    data: { service, label: label?.trim().slice(0, 40) || `Backup ${keys.length}`, apiKey: sealKey(plain), priority },
  });
  return { id: row.id, result: await testStoredKey(row.id) };
}

/** "Use this key": move it to the front. */
export async function activateKey(id: string) {
  const row = await prisma.apiKey.findUnique({ where: { id } });
  if (!row) return;
  const first = await prisma.apiKey.findFirst({ where: { service: row.service }, orderBy: { priority: "asc" } });
  const reset = (row.status === "limited" || row.status === "exhausted") && !row.until;
  await prisma.apiKey.update({
    where: { id },
    data: { priority: (first?.priority ?? 0) - 1, ...(reset ? { status: "ok", error: null } : {}) },
  });
}

/** Everything the Settings page needs, keys masked. */
export async function publicKeyState() {
  return Promise.all(
    (Object.keys(KEY_SERVICES) as KeyService[]).map(async (service) => {
      const meta = KEY_SERVICES[service];
      const keys = await loadKeys(service);
      const active = (await usableKeys(keys))[0];
      return {
        id: service,
        label: meta.label,
        what: meta.what,
        limits: meta.limits,
        how: meta.how,
        activeId: active?.id ?? null,
        nextReset: nextReset(keys)?.toISOString() ?? null,
        keys: keys.map((k) => ({
          id: k.id,
          label: k.label,
          masked: k.secret ? mask(k.secret) : "…",
          status: (k.secret ? k.status : "invalid") as KeyStatus,
          until: k.until?.toISOString() ?? null,
          error: k.secret ? k.error : "Couldn't decrypt this key.",
          info: k.info ? (JSON.parse(k.info) as Record<string, unknown>) : {},
          lastUsed: k.lastUsed?.toISOString() ?? null,
          uses: k.uses,
          fromEnv: k.fromEnv,
        })),
      };
    })
  );
}
