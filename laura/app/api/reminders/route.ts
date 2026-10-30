import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const reminders = await prisma.reminder.findMany({ orderBy: { dueAt: "asc" } });
  return NextResponse.json({ reminders });
}

const PRIORITIES = new Set(["low", "normal", "high"]);

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const title = typeof data?.title === "string" ? data.title.trim() : "";
  const note = typeof data?.note === "string" ? data.note : null;
  const dueAt = typeof data?.dueAt === "string" ? new Date(data.dueAt) : null;
  const priority = PRIORITIES.has(data?.priority) ? data.priority : "normal";

  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }
  if (!dueAt || Number.isNaN(dueAt.getTime())) {
    return NextResponse.json({ error: "A valid dueAt date is required." }, { status: 400 });
  }

  const reminder = await prisma.reminder.create({ data: { title, note, dueAt, priority } });
  return NextResponse.json({ reminder }, { status: 201 });
}
