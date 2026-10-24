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

/** The owner's chat id, for checking that an incoming update is from you.
 * Normalized because the stored env value can carry whitespace or quotes
 * from however it was pasted in -- harmless when sending (Telegram trims
 * it), but it breaks an exact string comparison against an update. */
export function ownerChatId(): string {
  return getChatId().trim().replace(/^["']|["']$/g, "");
}

/** A conversational reply inside the Telegram chat. Not logged to CallLog
 * (that history is for messages Laura sends you on purpose), sent as
 * plain text so a stray `*` or `_` in a reply can't fail Markdown parsing,
 * and capped at Telegram's 4096-character limit. */
export async function replyInChat(text: string): Promise<void> {
  const token = getBotToken();
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: getChatId(), text: text.slice(0, 4096) }),
  });
  if (!res.ok) console.error("Telegram reply failed:", res.status, await res.text());
}

/** Shows "typing…" in the chat while Laura works on a reply. */
export async function showTyping(): Promise<void> {
  const token = getBotToken();
  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: getChatId(), action: "typing" }),
  }).catch(() => {});
}

type InlineButton = { text: string; url: string } | { text: string; callback_data: string };

/** A message with tappable buttons under it -- link buttons open a URL,
 * callback buttons come back to the webhook as a callback_query. */
export async function sendWithButtons(text: string, rows: InlineButton[][]): Promise<boolean> {
  const token = getBotToken();
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: getChatId(), text: text.slice(0, 4096), reply_markup: { inline_keyboard: rows } }),
  });
  if (!res.ok) console.error("Telegram send with buttons failed:", res.status, await res.text());
  return res.ok;
}

/** Acknowledges a button tap (clears the spinner, optional toast) and
 * replaces the message text so the buttons can't be tapped twice. */
export async function resolveButtonTap(callbackId: string, messageId: number, newText: string, toast?: string) {
  const token = getBotToken();
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text: toast }),
  }).catch(() => {});
  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: getChatId(), message_id: messageId, text: newText.slice(0, 4096) }),
  }).catch(() => {});
}

/** Downloads a file someone sent the bot (voice note, photo) as base64.
 * Telegram serves bot downloads up to 20MB. */
export async function downloadTelegramFile(fileId: string): Promise<{ base64: string; path: string }> {
  const token = getBotToken();
  const meta = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`).then((r) => r.json());
  if (!meta.ok) throw new Error(meta.description ?? "Couldn't look up that file.");
  const path: string = meta.result.file_path;
  const res = await fetch(`https://api.telegram.org/file/bot${token}/${path}`);
  if (!res.ok) throw new Error(`Couldn't download that file (${res.status}).`);
  return { base64: Buffer.from(await res.arrayBuffer()).toString("base64"), path };
}
