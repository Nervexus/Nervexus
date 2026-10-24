import { GoogleGenAI } from "@google/genai";

// The non-"lite" flash alias free tier is capped at a measly 20
// requests/day -- flash-lite's free quota is far more usable for an
// assistant used throughout the day across chat, rota parsing, etc.
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
