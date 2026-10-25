import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/db";

// Passkeys (Face ID / Touch ID / device biometrics) via WebAuthn. The
// relying party is whatever host the request came in on, so it works on
// localhost and on the production domain without config. A passkey is
// bound to that domain: one created on laura-lyart.vercel.app only works
// there.
function rpFrom(request: Request) {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  return { rpID: host.split(":")[0], origin: `${proto}://${host}` };
}

const USER_ID = new TextEncoder().encode("laura-owner");

export async function registrationOptions(request: Request) {
  const { rpID } = rpFrom(request);
  const existing = await prisma.passkey.findMany({ select: { id: true, transports: true } });
  return generateRegistrationOptions({
    rpName: "Laura",
    rpID,
    userID: USER_ID,
    userName: "Madoxs Harvey",
    attestationType: "none",
    excludeCredentials: existing.map((p) => ({
      id: p.id,
      transports: (p.transports?.split(",") ?? []) as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: { residentKey: "preferred", userVerification: "required" },
  });
}

export async function finishRegistration(request: Request, response: RegistrationResponseJSON, challenge: string, label: string | null) {
  const { rpID, origin } = rpFrom(request);
  const result = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });
  if (!result.verified || !result.registrationInfo) return false;
  const { credential } = result.registrationInfo;
  await prisma.passkey.create({
    data: {
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: credential.transports?.join(",") ?? null,
      label,
    },
  });
  return true;
}

export async function authenticationOptions(request: Request) {
  const { rpID } = rpFrom(request);
  const passkeys = await prisma.passkey.findMany({ select: { id: true, transports: true } });
  return generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: passkeys.map((p) => ({
      id: p.id,
      transports: (p.transports?.split(",") ?? []) as AuthenticatorTransportFuture[],
    })),
  });
}

export async function finishAuthentication(request: Request, response: AuthenticationResponseJSON, challenge: string) {
  const { rpID, origin } = rpFrom(request);
  const passkey = await prisma.passkey.findUnique({ where: { id: response.id } });
  if (!passkey) return false;
  const result = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: passkey.id,
      publicKey: new Uint8Array(Buffer.from(passkey.publicKey, "base64url")),
      counter: passkey.counter,
      transports: (passkey.transports?.split(",") ?? []) as AuthenticatorTransportFuture[],
    },
  });
  if (!result.verified) return false;
  await prisma.passkey.update({
    where: { id: passkey.id },
    data: { counter: result.authenticationInfo.newCounter, lastUsedAt: new Date() },
  });
  return true;
}
