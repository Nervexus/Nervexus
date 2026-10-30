import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hqAuthorized } from "@/lib/hq";

// The outreach app adds a reminder, e.g. "Call back Smith Roofing".
export async function POST(request: Request) {
  if (!hqAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await request.json().catch(() => null);
  const title = typeof data?.title === "string" ? data.title.trim().slice(0, 200) : "";
  const dueAt = typeof data?.dueAt === "string" ? new Date(data.dueAt) : null;
  if (!title) return NextResponse.json({ error: "title is required." }, { status: 400 });
  if (!dueAt || Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: "dueAt must be an ISO date." }, { status: 400 });
  const note = typeof data?.note === "string" && data.note.trim() ? data.note.trim().slice(0, 1000) : null;
  const priority = data?.priority === "high" ? "high" : "normal";
  // Same title at the same time = the same reminder; don't double up on retries.
  const existing = await prisma.reminder.findFirst({ where: { title, dueAt } });
  const reminder = existing ?? (await prisma.reminder.create({ data: { title, dueAt, note, priority } }));
  return NextResponse.json({ reminder: { id: reminder.id, title: reminder.title, dueAt: reminder.dueAt } }, { status: existing ? 200 : 201 });
}
