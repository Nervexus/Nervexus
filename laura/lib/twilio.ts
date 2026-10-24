import twilio from "twilio";
import { prisma } from "@/lib/db";

// A free Twilio trial account can only call/text numbers you've verified
// in its console, and prepends a short "this call is from a trial
// account" disclaimer -- both go away once the account is upgraded, but
// neither blocks calling your own (verified) number in the meantime.
function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !authToken) {
    throw new Error(
      "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not set. Add them to .env.local."
    );
  }
  return twilio(sid, authToken);
}

function getFromNumber(): string {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("TWILIO_PHONE_NUMBER is not set. Add it to .env.local.");
  return from;
}

function getOwnerNumber(): string {
  const to = process.env.OWNER_PHONE_NUMBER;
  if (!to) {
    throw new Error(
      "OWNER_PHONE_NUMBER is not set -- this is the number Laura calls/texts, add it to .env.local."
    );
  }
  return to;
}

// The base URL Twilio needs to fetch the TwiML for a call back from --
// Vercel sets this automatically; falls back to a manual override for
// other hosts.
function getBaseUrl(): string {
  const explicit = process.env.PUBLIC_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  throw new Error(
    "Can't determine this app's public URL for Twilio's webhook -- set PUBLIC_BASE_URL in .env.local."
  );
}

export type CallResult = { ok: true; sid: string } | { ok: false; error: string };

/** Has Laura call OWNER_PHONE_NUMBER and read `message` aloud via TwiML
 * <Say>, logging the attempt either way. */
export async function placeCall(message: string): Promise<CallResult> {
  const toNumber = getOwnerNumber();
  try {
    const client = getClient();
    const from = getFromNumber();
    const twimlUrl = `${getBaseUrl()}/api/calls/twiml?message=${encodeURIComponent(message)}`;
    const call = await client.calls.create({ to: toNumber, from, url: twimlUrl });
    await prisma.callLog.create({
      data: { kind: "call", toNumber, message, status: "sent", twilioSid: call.sid },
    });
    return { ok: true, sid: call.sid };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Twilio call failed.";
    await prisma.callLog.create({
      data: { kind: "call", toNumber, message, status: "failed", error },
    });
    return { ok: false, error };
  }
}

/** Texts `message` to OWNER_PHONE_NUMBER, logging the attempt either way. */
export async function sendText(message: string): Promise<CallResult> {
  const toNumber = getOwnerNumber();
  try {
    const client = getClient();
    const from = getFromNumber();
    const sms = await client.messages.create({ to: toNumber, from, body: message });
    await prisma.callLog.create({
      data: { kind: "sms", toNumber, message, status: "sent", twilioSid: sms.sid },
    });
    return { ok: true, sid: sms.sid };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Twilio text failed.";
    await prisma.callLog.create({
      data: { kind: "sms", toNumber, message, status: "failed", error },
    });
    return { ok: false, error };
  }
}
