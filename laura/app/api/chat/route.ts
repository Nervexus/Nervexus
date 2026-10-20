import { NextResponse } from "next/server";
import { chat, type ChatMessage } from "@/lib/anthropic";

function isValidHistory(data: unknown): data is ChatMessage[] {
  return (
    Array.isArray(data) &&
    data.every(
      (m) =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
  );
}

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);

  if (!isValidHistory(data) || data.length === 0) {
    return NextResponse.json({ error: "Expected a non-empty message history." }, { status: 400 });
  }

  try {
    const reply = await chat(data);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Laura chat error:", error);
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
