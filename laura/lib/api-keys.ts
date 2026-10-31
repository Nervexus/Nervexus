import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";
import { decrypt, encrypt, type EncryptedValue } from "@/lib/crypto";

// Each service can hold several keys. The first usable one (by priority) is
// used; when it's rejected, rate-limited or used up it's marked with a status
// (and when that lifts) and the next usable key takes over in the same call.
// The key set in Vercel is imported as "Main key" and can't be removed here.

type ServiceMeta = { label: string; env?: string; what: string; limits: string; how: readonly string[]; builtIn?: boolean };

// Gemini is built in (Laura's brain). The rest can be added from Settings →
// API keys → Add an API; any other service can be added by name as a custom API.
export const KEY_SERVICES: Record<string, ServiceMeta> = {
  gemini: {
    label: "Gemini",
    env: "GEMINI_API_KEY",
    builtIn: true,
    what: "Laura's brain: chat, vision, voice notes and web search.",
    limits: "Free keys have per-minute and daily request limits. Daily limits reset at midnight Pacific time (8am UK).",
    how: [
      "Go to aistudio.google.com/apikey and sign in with a Google account",
      "Press Create API key (pick or create a Google Cloud project if asked)",
      "Copy the key and paste it here",
    ],
  },
  google_places: {
    label: "Google Places",
    env: "GOOGLE_PLACES_API_KEY",
    what: "Business and place search with ratings, opening hours and photos.",
    limits: "Google gives a free monthly credit. Daily request quotas reset at midnight Pacific time.",
    how: [
      "Open console.cloud.google.com and create (or pick) a project",
      "Turn on billing (a card is needed; light use is normally covered by the free credit)",
      'APIs & Services → Library → enable "Places API (New)"',
      "APIs & Services → Credentials → Create credentials → API key",
      "Copy the key and paste it here",
    ],
  },
  openai: {
    label: "OpenAI",
    env: "OPENAI_API_KEY",
    what: "GPT models, image generation and Whisper transcription.",
    limits: "Pay as you go. Rate limits depend on your usage tier; a key stops when the account runs out of credit.",
    how: ["Sign in at platform.openai.com", "Go to API keys → Create new secret key", "Copy the key (starts with sk-) and paste it here"],
  },
  anthropic: {
    label: "Anthropic (Claude)",
    env: "ANTHROPIC_API_KEY",
    what: "Claude models.",
    limits: "Pay as you go, with per-minute rate limits that depend on your usage tier.",
    how: ["Sign in at console.anthropic.com", "Go to API keys → Create key", "Copy the key (starts with sk-ant-) and paste it here"],
  },
  elevenlabs: {
    label: "ElevenLabs",
    env: "ELEVENLABS_API_KEY",
    what: "Natural-sounding text-to-speech voices.",
    limits: "Free plan: about 10,000 characters a month, resetting on your plan date.",
    how: ["Sign in at elevenlabs.io", "Click your profile → API keys → Create API key", "Copy the key and paste it here"],
  },
  openweather: {
    label: "OpenWeather",
    env: "OPENWEATHER_API_KEY",
    what: "Current weather and forecasts.",
    limits: "Free plan: 60 calls a minute and 1,000,000 a month. New keys can take up to 2 hours to start working.",
    how: ["Sign up at openweathermap.org", "Open your profile → My API keys", "Copy the default key (or generate one) and paste it here"],
  },
};

const CUSTOM = "custom:";

/** A catalogue service, or a custom one stored as "custom:<name>". */
export function serviceMeta(service: string): ServiceMeta {
  if (service.startsWith(CUSTOM)) {
    return {
      label: service.slice(CUSTOM.length),
      what: "A custom API you added.",
      limits: "Laura can't check custom keys, so they're saved as working.",
      how: ["Get the key from the service's dashboard", "Paste it here"],
    };
  }
  return KEY_SERVICES[service];
}

export function customServiceId(name: string): string {
  return CUSTOM + name.trim().replace(/\s+/g, " ").slice(0, 40);
}

function envKey(service: string): string | undefined {
  const name = serviceMeta(service).env;
  return name ? process.env[name]?.trim() || undefined : undefined;
}

export type KeyService = string;
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
  return typeof value === "string" && (value in KEY_SERVICES || (value.startsWith(CUSTOM) && value.length > CUSTOM.length));
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
    super(`${serviceMeta(service).label} has no working API key. Add one in Settings → API keys.`);
    this.name = "NoWorkingKeyError";
  }
}

type Row = Awaited<ReturnType<typeof prisma.apiKey.findMany>>[number];
export type LoadedKey = Row & { secret: string | null; fromEnv: boolean };

// ------------------------------------------------------------------ loading

/** The key set in Vercel joins the list as "Main key" the first time it's seen. */
async function ensureEnvKey(service: KeyService, rows: LoadedKey[]): Promise<boolean> {
  const env = envKey(service);
  if (!env || rows.some((r) => r.secret === env)) return false;
  const first = rows.reduce((min, r) => Math.min(min, r.priority), 1);
  await prisma.apiKey.create({ data: { service, label: "Main key", apiKey: sealKey(env), priority: first - 1 } });
  return true;
}

export async function loadKeys(service: KeyService): Promise<LoadedKey[]> {
  const read = async () => {
    const rows = await prisma.apiKey.findMany({ where: { service }, orderBy: [{ priority: "asc" }, { createdAt: "asc" }] });
    const env = envKey(service);
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
export function classifyProviderError(err: unknown): Classified {
  const status = (err as { status?: number }).status;
  const text = err instanceof Error ? err.message : String(err);
  if (status === 401 || status === 403 || (status === 400 && /api key/i.test(text))) {
    return { kind: "invalid", until: null, message: "Rejected by Google. It may have been deleted or mistyped." };
  }
  if (status === 429 || /RESOURCE_EXHAUSTED|rate limit|quota/i.test(text)) {
    if (/PerDay|per day|daily/i.test(text)) {
      return { kind: "exhausted", until: nextPacificMidnight(), message: "Daily limit used up." };
    }
    if (/billing|credit|insufficient_quota/i.test(text)) {
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
    const env = envKey(service);
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
      const c = classifyProviderError(err);
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
      const c = classifyProviderError(err);
      if (c.kind === "invalid" || c.kind === "limited" || c.kind === "exhausted") {
        return { ok: false, status: c.kind, message: c.message, until: c.until };
      }
      // Any other answer from Google still proves the key was accepted.
      if (c.kind === "other") return { ok: true, status: "ok", message: "Working" };
      return { ok: false, status: "error", message: "Couldn't reach Google. Try again." };
    }
  }

  const check = HTTP_CHECKS[service];
  if (!check) return { ok: true, status: "ok", message: "Saved. Laura can't test custom keys, so it's assumed to work." };
  let res: Response;
  try {
    res = await check(secret);
  } catch {
    return { ok: false, status: "error", message: `Couldn't reach ${serviceMeta(service).label}. Try again.` };
  }
  if (res.ok) return { ok: true, status: "ok", message: "Working" };
  const body = (await res.text()).slice(0, 400);
  if (res.status === 429) {
    if (/quota|insufficient|credit|billing/i.test(body) && service !== "openai") {
      return { ok: false, status: "exhausted", message: "Quota used up.", until: nextPacificMidnight() };
    }
    if (/insufficient_quota/i.test(body)) {
      return { ok: false, status: "exhausted", message: "Out of credit.", until: new Date(Date.now() + 24 * 3600_000) };
    }
    return { ok: false, status: "limited", message: "Rate-limited, try again in a minute.", until: new Date(Date.now() + 60_000) };
  }
  if (res.status === 401 || res.status === 403 || res.status === 400) {
    return { ok: false, status: "invalid", message: `${serviceMeta(service).label} rejected this key.` };
  }
  return { ok: false, status: "error", message: `${serviceMeta(service).label} answered with an error (${res.status}). Try again later.` };
}

// A cheap request per service that only succeeds with a valid key.
const HTTP_CHECKS: Record<string, (key: string) => Promise<Response>> = {
  google_places: (key) =>
    fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id" },
      body: JSON.stringify({ textQuery: "cafe in London", pageSize: 1 }),
    }),
  openai: (key) => fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${key}` } }),
  anthropic: (key) =>
    fetch("https://api.anthropic.com/v1/models", { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } }),
  elevenlabs: (key) => fetch("https://api.elevenlabs.io/v1/user", { headers: { "xi-api-key": key } }),
  openweather: (key) =>
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=${encodeURIComponent(key)}`),
};

/** Built-in services, catalogue services set in Vercel, and any service that has keys saved. */
export async function activeServices(): Promise<KeyService[]> {
  const saved = await prisma.apiKey.findMany({ distinct: ["service"], select: { service: true } });
  const ids = new Set<string>(Object.entries(KEY_SERVICES).filter(([id, m]) => m.builtIn || envKey(id)).map(([id]) => id));
  for (const { service } of saved) if (isKeyService(service)) ids.add(service);
  return [...ids];
}

/** The services offered under "Add an API". */
export function catalogue() {
  return Object.entries(KEY_SERVICES)
    .filter(([, m]) => !m.builtIn)
    .map(([id, m]) => ({ id, label: m.label, what: m.what, limits: m.limits, how: m.how }));
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
    data: {
      service,
      label: label?.trim().slice(0, 40) || (keys.length ? `Backup ${keys.length}` : "Main key"),
      apiKey: sealKey(plain),
      priority,
    },
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
    (await activeServices()).map(async (service) => {
      const meta = serviceMeta(service);
      const keys = await loadKeys(service);
      const active = (await usableKeys(keys))[0];
      return {
        id: service,
        label: meta.label,
        builtIn: !!meta.builtIn,
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
