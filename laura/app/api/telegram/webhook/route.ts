import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chat, type ChatMessage } from "@/lib/brain";
import { downloadTelegramFile, ownerChatId, replyInChat, resolveButtonTap, sendPlaceCard, showTyping } from "@/lib/telegram";
import { placeCaption } from "@/lib/places";
import { transcribeAudio } from "@/lib/transcribe";
import { parseRotaFile, saveShifts } from "@/lib/rota";
import { fileKind } from "@/lib/files";
import { answerAboutFile } from "@/lib/read-file";
import { afternoonMessage, morningMessage, nightMessage } from "@/lib/routine";
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
  const doc: { file_id: string; mime_type?: string; file_name?: string } | undefined = msg?.document;
  const caption: string = typeof msg?.caption === "string" ? msg.caption.trim() : "";
  const fromOwner = String(msg?.chat?.id) === ownerChatId();
  if (!msg || !fromOwner || (!text && !voice && !photos?.length && !doc)) {
    console.warn("Telegram update ignored:", {
      hasMessage: Boolean(msg),
      fromOwner,
      hasContent: Boolean(text || voice || photos?.length || doc),
    });
    return NextResponse.json({ ok: true });
  }

  if (text === "/start") {
    await replyInChat("Hi, I'm Laura. Message me here any time, same as on the site. You can also send voice notes, or a photo of your rota.");
    return NextResponse.json({ ok: true });
  }
  if (text === "/morning" || text === "/afternoon" || text === "/night") {
    const profile = await prisma.profile.findUnique({ where: { id: "me" } });
    const tone = profile && !profile.motivation ? null : (profile?.motivationTone ?? "harsh");
    await replyInChat(
      text === "/morning"
        ? await morningMessage({ motivationTone: tone })
        : text === "/afternoon"
          ? await afternoonMessage({ motivationTone: tone })
          : await nightMessage()
    );
    return NextResponse.json({ ok: true });
  }

  await showTyping();
  try {
    if (photos?.length || doc) {
      await handleFile(
        photos?.length ? { fileId: photos[photos.length - 1].file_id, mime: "image/jpeg", name: null } : { fileId: doc!.file_id, mime: doc!.mime_type ?? null, name: doc!.file_name ?? null },
        caption
      );
    } else if (voice) {
      const { base64 } = await downloadTelegramFile(voice.file_id);
      const transcript = await transcribeAudio(base64, voice.mime_type ?? "audio/ogg");
      if (!transcript) {
        await replyInChat("I couldn't make out that voice note -- could you try again?");
      } else {
        await answer(transcript);
      }
    } else if (text) {
      await answer(text);
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

// Runs one turn through Laura's brain with the shared web/Telegram history
// and sends the result: any places she's showing (photos + details) first,
// then her own text, the way a person would send pictures then a message.
async function answer(text: string): Promise<void> {
  const priorRows = await prisma.chatMessage.findMany({ orderBy: { createdAt: "asc" } });
  const history: ChatMessage[] = [
    ...priorRows.map((r) => ({
      role: r.role === "user" ? ("user" as const) : ("assistant" as const),
      content: r.content,
    })),
    { role: "user", content: text },
  ];
  await prisma.chatMessage.create({ data: { role: "user", content: text } });
  const { reply, places } = await chat(history);
  await prisma.chatMessage.create({ data: { role: "assistant", content: reply } });
  for (const place of places) {
    await sendPlaceCard(place.images, placeCaption(place));
  }
  if (reply.trim()) await replyInChat(reply);
}

// Photos and files. A rota (said so in the caption, or a photo/sheet sent
// with no caption) is read and its shifts saved straight away, then listed
// back so a misread is easy to spot. Anything else -- a letter, a bill, a
// screenshot -- is read and answered, using the caption as the question.
async function handleFile(file: { fileId: string; mime: string | null; name: string | null }, caption: string) {
  const { base64, path } = await downloadTelegramFile(file.fileId);
  const buf = Buffer.from(base64, "base64");
  const name = file.name ?? path.split("/").pop() ?? null;
  const kind = fileKind(file.mime, name);
  const saysRota = /\b(rota|shifts?|schedule)\b/i.test(caption);
  const rotaShaped = !caption && (kind === "image" || kind === "xlsx" || kind === "csv");

  if (saysRota || rotaShaped) {
    let shifts: Awaited<ReturnType<typeof parseRotaFile>> = [];
    try {
      shifts = await parseRotaFile(buf, file.mime, name);
    } catch (err) {
      if (saysRota) return void (await replyInChat(err instanceof Error ? err.message : "I couldn't read that rota."));
    }
    if (shifts.length > 0) {
      const added = await saveShifts(shifts, "photo");
      await prisma.activityLog.create({ data: { tool: "get_shifts", summary: `Added ${added.length} shifts from a rota file` } }).catch(() => {});
      const t = (d: Date) => d.toLocaleTimeString("en-GB", { timeZone: USER_TIMEZONE, hour: "2-digit", minute: "2-digit" });
      const lines = shifts.map((s) => {
        const start = new Date(s.startAt);
        return `• ${friendlyDateTime(start).replace(/, \d\d:\d\d$/, "")} ${t(start)}–${t(new Date(s.endAt))}${s.colleagues ? ` · with ${s.colleagues}` : ""}`;
      });
      const already = shifts.length - added.length;
      await replyInChat(
        `${added.length ? `Added ${added.length} shift${added.length === 1 ? "" : "s"}` : "Nothing new to add"}:\n${lines.join("\n")}` +
          (already ? `\n\n${already} ${already === 1 ? "was" : "were"} already on your rota.` : "") +
          "\n\nAnything wrong, fix it on the Rota page."
      );
      return;
    }
    if (saysRota) {
      await replyInChat("I couldn't find any upcoming shifts for you (Madoxs) on that. Is your name on it? A clearer photo or the original spreadsheet helps.");
      return;
    }
  }

  const question = caption || "What's this? Give me the key points.";
  const reply = await answerAboutFile(buf, file.mime, name, question);
  await prisma.chatMessage.create({ data: { role: "user", content: `[Sent a file${name ? `: ${name}` : ""}] ${caption}`.trim() } });
  await prisma.chatMessage.create({ data: { role: "assistant", content: reply } });
  await replyInChat(reply);
}
