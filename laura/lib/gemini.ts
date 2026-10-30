import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";
import { prisma } from "@/lib/db";
import { openKey } from "@/lib/api-keys";

export const MODEL = "gemini-flash-lite-latest";

const KEY_CACHE_MS = 30_000;
let cachedKeys: { keys: string[]; at: number } | null = null;
const clients = new Map<string, GoogleGenAI>();

// Main key from the environment first, then the backups from Settings in
// their saved order.
async function geminiKeys(): Promise<string[]> {
  if (cachedKeys && Date.now() - cachedKeys.at < KEY_CACHE_MS) return cachedKeys.keys;
  const envKey = process.env.GEMINI_API_KEY;
  let backups: string[] = [];
  try {
    const rows = await prisma.apiKey.findMany({
      where: { service: "gemini", active: true },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      select: { apiKey: true },
    });
    backups = rows.flatMap((r) => {
      try {
        return [openKey(r.apiKey)];
      } catch {
        return [];
      }
    });
  } catch {
    // DB unreachable: the env key alone still works.
  }
  const keys = [...new Set([...(envKey ? [envKey] : []), ...backups])];
  cachedKeys = { keys, at: Date.now() };
  return keys;
}

export function clearGeminiKeyCache() {
  cachedKeys = null;
}

// Errors that mean "this key can't serve the request" rather than "the
// request itself is bad" -- only these move on to the next key.
function isKeyProblem(err: unknown): boolean {
  const status = (err as { status?: number }).status;
  const message = err instanceof Error ? err.message : String(err);
  if (status === 401 || status === 403 || status === 429) return true;
  if (status === 400 && /api key/i.test(message)) return true;
  return /RESOURCE_EXHAUSTED|quota/i.test(message);
}

async function generateWithFallback(params: GenerateContentParameters): Promise<GenerateContentResponse> {
  const keys = await geminiKeys();
  if (keys.length === 0) {
    throw new Error("No Gemini API key configured. Add one in Settings or set GEMINI_API_KEY.");
  }
  let lastError: unknown;
  for (const key of keys) {
    let client = clients.get(key);
    if (!client) {
      client = new GoogleGenAI({ apiKey: key });
      clients.set(key, client);
    }
    try {
      return await client.models.generateContent(params);
    } catch (err) {
      lastError = err;
      if (!isKeyProblem(err)) throw err;
    }
  }
  throw lastError;
}

export type GeminiClient = { models: { generateContent: typeof generateWithFallback } };

const fallbackClient: GeminiClient = { models: { generateContent: generateWithFallback } };

export function getGeminiClient(): GeminiClient {
  return fallbackClient;
}

/** Throws if Google rejects the key outright. */
export async function checkGeminiKey(apiKey: string): Promise<void> {
  await new GoogleGenAI({ apiKey }).models.get({ model: MODEL });
}
