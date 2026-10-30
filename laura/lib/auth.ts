import { prisma } from "@/lib/db";
import { hashPin, verifyPin } from "@/lib/pin";
import { passwordMatches, recoveryMatches } from "@/lib/session";

// The main sign-in password. The owner sets it inside the app (stored as a
// salted hash on the Profile singleton); until they do, the APP_PASSWORD
// env var is accepted so the first sign-in still works. The backup
// RECOVERY_PASSWORD (recoveryMatches) is handled separately at the login
// route — it's the emergency credential, not the main password.

export async function isPasswordSet(): Promise<boolean> {
  const profile = await prisma.profile.findUnique({ where: { id: "me" }, select: { passwordHash: true } });
  return Boolean(profile?.passwordHash) || Boolean(process.env.APP_PASSWORD);
}

/** True if `candidate` is the main password (the in-app one, or the env
 * fallback when none has been set in the app yet). */
export async function verifyMainPassword(candidate: string): Promise<boolean> {
  if (!candidate) return false;
  const profile = await prisma.profile.findUnique({ where: { id: "me" }, select: { passwordHash: true, passwordSalt: true } });
  if (profile?.passwordHash && profile.passwordSalt) {
    return verifyPin(candidate, profile.passwordHash, profile.passwordSalt);
  }
  return passwordMatches(candidate);
}

/** Sets (or changes) the main password. */
export async function setMainPassword(next: string): Promise<void> {
  const { hash, salt } = hashPin(next);
  await prisma.profile.upsert({
    where: { id: "me" },
    create: { id: "me", passwordHash: hash, passwordSalt: salt },
    update: { passwordHash: hash, passwordSalt: salt },
  });
}

/** For changing the password: accepts the current main password, or the
 * emergency backup, so a forgotten main password can still be reset. */
export async function canChangePassword(current: string): Promise<boolean> {
  return (await verifyMainPassword(current)) || recoveryMatches(current);
}
