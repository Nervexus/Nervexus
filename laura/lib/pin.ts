import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// A locked note folder stores a salted hash of its PIN, never the PIN
// itself. There's no server-side "unlocked" session -- the Notes page
// just keeps unlocked folder ids in memory for as long as it's open.
export function hashPin(pin: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPin(pin: string, hash: string, salt: string): boolean {
  const candidate = scryptSync(pin, salt, 64);
  const stored = Buffer.from(hash, "hex");
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}
