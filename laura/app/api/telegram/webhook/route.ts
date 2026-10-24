import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chat, type ChatMessage } from "@/lib/brain";
import { downloadTelegramFile, ownerChatId, replyInChat, resolveButtonTap, showTyping } from "@/lib/telegram";
import { transcribeAudio } from "@/lib/transcribe";
import { parseRotaImage } from "@/lib/rota";
import { friendlyDateTime, USER_TIMEZONE } from "@/lib/booking-links";

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
  const voice: { file_id: string; mime_type?: string } | undefined = msg?.voice ?? msg?.audio;
  const photos: { file_id: string }[] | undefined = msg?.photo;
  const fromOwner = String(msg?.chat?.id) === ownerChatId();
  if (!msg || !fromOwner || (!text && !voice && !photos?.length)) {
    console.warn("Telegram update ignored:", {
      hasMessage: Boolean(msg),
      fromOwner,
      hasContent: Boolean(text || voice || photos?.length),
    });
    return NextResponse.json({ ok: true });
  }

  if (text === "/start") {
    await replyInChat("Hi, I'm Laura. Message me here any time, same as on the site. You can also send voice notes, or a photo of your rota.");
    return NextResponse.json({ ok: true });
  }

  await showTyping();
  try {
    if (photos?.length) {
      await handleRotaPhoto(photos[photos.length - 1].file_id);
    } else if (voice) {
      const { base64 } = await downloadTelegramFile(voice.file_id);
      const transcript = await transcribeAudio(base64, voice.mime_type ?? "audio/ogg");
      if (!transcript) {
        await replyInChat("I couldn't make out that voice note -- could you try again?");
      } else {
        const reply = await answer(transcript);
        await replyInChat(`🎙 "${transcript}"\n\n${reply}`);
      }
    } else if (text) {
      await replyInChat(await answer(text));
    }
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

// Runs one turn through Laura's brain with the shared web/Telegram history.
async function answer(text: string): Promise<string> {
  const priorRows = await prisma.chatMessage.findMany({ orderBy: { createdAt: "asc" } });
  const history: ChatMessage[] = [
    ...priorRows.map((r) => ({
      role: r.role === "user" ? ("user" as const) : ("assistant" as const),
      content: r.content,
    })),
    { role: "user", content: text },
  ];
  await prisma.chatMessage.create({ data: { role: "user", content: text } });
  const { reply } = await chat(history);
  await prisma.chatMessage.create({ data: { role: "assistant", content: reply } });
  return reply;
}

// A photo is read as a work rota: any shifts found are saved straight away
// with source "photo" (the same marker the Rota page's upload uses), then
// listed back so a misread is easy to spot and fix on the Rota page.
async function handleRotaPhoto(fileId: string) {
  const { base64, path } = await downloadTelegramFile(fileId);
  const mimeType = path.endsWith(".png") ? "image/png" : "image/jpeg";
  const shifts = await parseRotaImage(base64, mimeType);
  const valid = shifts.filter((s) => {
    const a = new Date(s.startAt).getTime();
    const b = new Date(s.endAt).getTime();
    return !Number.isNaN(a) && !Number.isNaN(b) && b > a;
  });
  if (valid.length === 0) {
    await replyInChat("That doesn't look like a rota to me -- I couldn't find any shifts in it. If it is one, try a clearer, straight-on photo.");
    return;
  }
  for (const s of valid) {
    await prisma.shift.create({
      data: {
        startAt: new Date(s.startAt),
        endAt: new Date(s.endAt),
        location: s.location,
        colleagues: s.colleagues,
        note: s.note,
        source: "photo",
      },
    });
  }
  await prisma.activityLog.create({ data: { tool: "get_shifts", summary: `Added ${valid.length} shifts from a rota photo` } }).catch(() => {});
  const lines = valid.map((s) => {
    const start = new Date(s.startAt);
    const end = new Date(s.endAt);
    const t = (d: Date) => d.toLocaleTimeString("en-GB", { timeZone: USER_TIMEZONE, hour: "2-digit", minute: "2-digit" });
    return `• ${friendlyDateTime(start).replace(/, \d\d:\d\d$/, "")} ${t(start)}–${t(end)}${s.location ? ` · ${s.location}` : ""}`;
  });
  await replyInChat(`Added ${valid.length} shift${valid.length === 1 ? "" : "s"} from your rota:\n${lines.join("\n")}\n\nAnything wrong, you can fix it on the Rota page.`);
}
