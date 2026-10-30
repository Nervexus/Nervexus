import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { answerAboutFile } from "@/lib/read-file";
import { fileKind } from "@/lib/files";

// A file attached in the in-app Laura chat: a photo, PDF, spreadsheet or
// text file, with an optional note. Laura reads it and answers; the
// exchange is saved to the shared chat history like any other message.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const caption = typeof form?.get("caption") === "string" ? (form.get("caption") as string).trim() : "";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "That file is too big (max 12MB)." }, { status: 413 });
  }
  if (!fileKind(file.type || null, file.name || null)) {
    return NextResponse.json({ error: "I can read photos, PDFs, Excel, CSV and text files." }, { status: 415 });
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const question = caption || "What's this? Give me the key points.";
    const reply = await answerAboutFile(buf, file.type || null, file.name || null, question);
    const userLine = `[Sent a file${file.name ? `: ${file.name}` : ""}]${caption ? ` ${caption}` : ""}`;
    await prisma.chatMessage.create({ data: { role: "user", content: userLine } });
    await prisma.chatMessage.create({ data: { role: "assistant", content: reply } });
    return NextResponse.json({ reply, userLine });
  } catch (err) {
    console.error("chat file error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Couldn't read that file." }, { status: 500 });
  }
}
