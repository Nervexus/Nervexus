import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";

export const MODEL = "gemini-flash-lite-latest";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Add it to .env.local to talk to Laura.");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

async function getActiveKeys(): Promise<string[]> {
  try {
    const rows = await prisma.apiKey.findMany({
      where: { service: "gemini", active: true },
      orderBy: { priority: "asc" },
      select: { apiKey: true },
    });
    return rows.map((r) => r.apiKey);
  } catch {
    return [];
  }
}

export async function getGeminiClientWithFallback(): Promise<GoogleGenAI> {
  const dbKeys = await getActiveKeys();
  const envKey = process.env.GEMINI_API_KEY;
  const allKeys = [...dbKeys, ...(envKey ? [envKey] : [])];
  if (allKeys.length === 0) {
    throw new Error("No Gemini API keys configured. Add one in Settings or set GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey: allKeys[0] });
}

export async function callWithFallback<T>(
  fn: (client: GoogleGenAI) => Promise<T>,
): Promise<T> {
  const dbKeys = await getActiveKeys();
  const envKey = process.env.GEMINI_API_KEY;
  const allKeys = [...dbKeys, ...(envKey ? [envKey] : [])];
  if (allKeys.length === 0) {
    throw new Error("No Gemini API keys configured. Add one in Settings or set GEMINI_API_KEY.");
  }

  let lastError: Error | null = null;
  for (const key of allKeys) {
    try {
      return await fn(new GoogleGenAI({ apiKey: key }));
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const status = (err as { status?: number }).status;
      if (status === 429 || status === 403 || status === 401) continue;
      throw lastError;
    }
  }
  throw lastError ?? new Error("All API keys exhausted.");
}
