import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chat, type ChatMessage } from "@/lib/brain";
import { ownerChatId, replyInChat, showTyping } from "@/lib/telegram";

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
  const msg = update?.message;
  const text: string | undefined = typeof msg?.text === "string" ? msg.text.trim() : undefined;
  if (!msg || String(msg.chat?.id) !== ownerChatId() || !text) {
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
