import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chat, type ChatMessage } from "@/lib/brain";

export async function GET() {
  const rows = await prisma.chatMessage.findMany({ orderBy: { createdAt: "asc" } });
  const messages = rows.map((r) => ({
    role: r.role === "user" ? ("user" as const) : ("assistant" as const),
    content: r.content,
    createdAt: r.createdAt.toISOString(),
  }));
  return NextResponse.json({ messages });
}

export async function DELETE() {
  await prisma.chatMessage.deleteMany({});
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const message = typeof data?.message === "string" ? data.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "Expected a non-empty message." }, { status: 400 });
  }

  const priorRows = await prisma.chatMessage.findMany({ orderBy: { createdAt: "asc" } });
  const history: ChatMessage[] = [
    ...priorRows.map((r) => ({
      role: r.role === "user" ? ("user" as const) : ("assistant" as const),
      content: r.content,
    })),
    { role: "user", content: message },
  ];

  await prisma.chatMessage.create({ data: { role: "user", content: message } });

  try {
    const { reply, toolsUsed } = await chat(history);
    await prisma.chatMessage.create({ data: { role: "assistant", content: reply } });
    return NextResponse.json({ reply, toolsUsed });
  } catch (error) {
    console.error("Laura chat error:", error);
    const errMessage = error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
