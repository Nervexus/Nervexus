import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";
import { withKey } from "@/lib/api-keys";

export const MODEL = "gemini-flash-lite-latest";

const clients = new Map<string, GoogleGenAI>();

// Each call uses the first working key (the Vercel key, then backups from
// Settings) and fails over to the next on a rejected, rate-limited or
// used-up key. See lib/api-keys.ts.
async function generateWithFallback(params: GenerateContentParameters): Promise<GenerateContentResponse> {
  return withKey("gemini", (key) => {
    let client = clients.get(key);
    if (!client) {
      client = new GoogleGenAI({ apiKey: key });
      clients.set(key, client);
    }
    return client.models.generateContent(params);
  });
}

export type GeminiClient = { models: { generateContent: typeof generateWithFallback } };

const fallbackClient: GeminiClient = { models: { generateContent: generateWithFallback } };

export function getGeminiClient(): GeminiClient {
  return fallbackClient;
}
