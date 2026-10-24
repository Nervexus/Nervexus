import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chat, type ChatMessage } from "@/lib/brain";
import { ownerChatId, replyInChat, resolveButtonTap, showTyping } from "@/lib/telegram";
import { friendlyDateTime } from "@/lib/booking";

// Telegram calls this for every message sent to the bot (registered via
// setWebhook with a secret_token). Only the owner's chat gets answers;
// anything else is acknowledged and ignored so Telegram stops retrying.
// The conversation shares ChatMessage history with the web chat, so you
// can start on the site and carry on in Telegram, or the other way round.
export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = await request.json().catch(() => null);

  if (update?.callback_query) {
    await handleButtonTap(update.callback_query);
    return NextResponse.json({ ok: true });
  }
  const msg = update?.message;
  const text: string | undefined = typeof msg?.text === "string" ? msg.text.trim() : undefined;
  if (!msg || String(msg.chat?.id) !== ownerChatId() || !text) {
    console.warn("Telegram update ignored:", {
      hasMessage: Boolean(msg),
      fromOwner: String(msg?.chat?.id) === ownerChatId(),
      hasText: Boolean(text),
    });
    return NextResponse.json({ ok: true });
  }

  if (text === "/start") {
    await replyInChat("Hi, I'm Laura. Message me here any time, same as on the site.");
    return NextResponse.json({ ok: true });
  }

  await showTyping();

  const priorRows = await prisma.chatMessage.findMany({ orderBy: { createdAt: "asc" } });
  const history: ChatMessage[] = [
    ...priorRows.map((r) => ({
      role: r.role === "user" ? ("user" as const) : ("assistant" as const),
      content: r.content,
    })),
    { role: "user", content: text },
  ];
  await prisma.chatMessage.create({ data: { role: "user", content: text } });

  try {
    const { reply } = await chat(history);
    await prisma.chatMessage.create({ data: { role: "assistant", content: reply } });
    await replyInChat(reply);
  } catch (error) {
    console.error("Telegram chat error:", error);
    await replyInChat("Sorry, something went wrong on my end. Try that again in a moment.");
  }
  return NextResponse.json({ ok: true });
}

const REMINDER_LEAD_MS = 2 * 60 * 60 * 1000;

type CallbackQuery = { id: string; data?: string; message?: { message_id: number; chat?: { id: number | string } } };

// Buttons from prepare_booking: "bk:ok:<id>" confirms the booking (and sets
// a reminder two hours before, when that's still in the future), "bk:no:<id>"
// cancels it. The message text is replaced so a second tap does nothing.
async function handleButtonTap(cq: CallbackQuery) {
  if (!cq.message || String(cq.message.chat?.id) !== ownerChatId()) return;
  const [kind, action, id] = (cq.data ?? "").split(":");
  if (kind !== "bk" || !id) return;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    await resolveButtonTap(cq.id, cq.message.message_id, "That booking no longer exists.");
    return;
  }

  if (action === "ok") {
    await prisma.booking.update({ where: { id }, data: { status: "confirmed" } });
    let reminderNote = "";
    if (booking.dateTime && booking.dateTime.getTime() - REMINDER_LEAD_MS > Date.now()) {
      await prisma.reminder.create({
        data: {
          title: booking.title,
          dueAt: new Date(booking.dateTime.getTime() - REMINDER_LEAD_MS),
          note: [booking.location, booking.partySize ? `${booking.partySize} people` : null].filter(Boolean).join(" · ") || null,
          priority: "high",
        },
      });
      reminderNote = "\nI'll remind you two hours before.";
    }
    await prisma.activityLog.create({ data: { tool: "create_booking", summary: `Confirmed "${booking.title}"` } }).catch(() => {});
    const when = booking.dateTime ? ` for ${friendlyDateTime(booking.dateTime)}` : "";
    await resolveButtonTap(cq.id, cq.message.message_id, `✅ ${booking.title} is booked${when}.${reminderNote}`, "Marked as booked");
  } else if (action === "no") {
    await prisma.booking.update({ where: { id }, data: { status: "cancelled" } });
    await resolveButtonTap(cq.id, cq.message.message_id, `✖ Skipped ${booking.title}.`, "Skipped");
  }
}
