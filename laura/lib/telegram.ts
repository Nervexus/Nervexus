import { prisma } from "@/lib/db";

// Telegram's Bot API is free with no trial limits, no card, and no
// approval process -- unlike a real PSTN call/SMS, nobody charges per
// message. The trade-off: it can't make the phone literally ring like a
// phone call (no free provider can -- carrier termination always costs
// money), it just sends an instant push notification. "call_me" sends an
// urgent-styled message; "text_me" sends a plain one.
function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not set. Create a bot via @BotFather and add its token to .env.local."
    );
  }
  return token;
}

function getChatId(): string {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    throw new Error(
      "TELEGRAM_CHAT_ID is not set -- message your bot once, then fetch it from " +
        "https://api.telegram.org/bot<token>/getUpdates and add it to .env.local."
    );
  }
  return chatId;
}

export type CallResult = { ok: true; sid: string } | { ok: false; error: string };

type LogAttempt = {
  kind: "call" | "sms";
  target: string;
  message: string;
  status: "sent" | "failed";
  error?: string;
  providerId?: string;
};

// Best-effort and isolated on purpose: whether Telegram actually delivered
// the message is already decided by the time this runs, so a CallLog
// write failure (e.g. the migration isn't applied yet) must never flip a
// real success into a reported failure, or vice versa.
async function logAttempt(attempt: LogAttempt) {
  try {
    await prisma.callLog.create({
      data: {
        kind: attempt.kind,
        target: attempt.target,
        message: attempt.message,
        status: attempt.status,
        error: attempt.error ?? null,
        providerId: attempt.providerId ?? null,
      },
    });
  } catch (err) {
    console.error("CallLog write failed:", err);
  }
}

async function send(kind: "call" | "sms", text: string): Promise<CallResult> {
  const chatId = getChatId();
  try {
    const token = getBotToken();
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.description ?? `Telegram API returned ${res.status}.`);
    }
    const messageId = String(data.result.message_id);
    await logAttempt({ kind, target: chatId, message: text, status: "sent", providerId: messageId });
    return { ok: true, sid: messageId };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Telegram send failed.";
    await logAttempt({ kind, target: chatId, message: text, status: "failed", error });
    return { ok: false, error };
  }
}

/** Sends an urgent-styled Telegram message -- the closest free
 * equivalent to "Laura calls you": instant, attention-grabbing, but not
 * a real ringing phone call. */
export async function placeCall(message: string): Promise<CallResult> {
  return send("call", `☎️ *Laura calling:*\n${message}`);
}

/** Sends a plain Telegram message. */
export async function sendText(message: string): Promise<CallResult> {
  return send("sms", message);
}
