import { decrypt, encrypt, type EncryptedValue } from "@/lib/crypto";

// Services that support backup keys. The env var is always the main key;
// keys added in Settings are tried after it, in the order set there.
export const KEY_SERVICES = [
  {
    id: "gemini",
    label: "Gemini",
    env: "GEMINI_API_KEY",
    detail: "Laura's brain: chat, vision, voice notes and web search",
    limits: "Free keys have a daily request limit that resets every day. When one runs out Laura moves to the next key.",
    how: [
      "Go to aistudio.google.com/apikey and sign in with a Google account",
      "Press Create API key (pick or create a Google Cloud project if asked)",
      "Copy the key and paste it here",
    ],
  },
] as const;

export type KeyService = (typeof KEY_SERVICES)[number]["id"];

export function isKeyService(value: unknown): value is KeyService {
  return KEY_SERVICES.some((s) => s.id === value);
}

export function sealKey(plain: string): string {
  return JSON.stringify(encrypt(plain));
}

export function openKey(stored: string): string {
  return decrypt(JSON.parse(stored) as EncryptedValue);
}

export function maskTail(plain: string | undefined): string {
  return plain && plain.length > 4 ? `••••${plain.slice(-4)}` : "••••";
}

export function maskStored(stored: string): string {
  try {
    return maskTail(openKey(stored));
  } catch {
    return "••••";
  }
}
