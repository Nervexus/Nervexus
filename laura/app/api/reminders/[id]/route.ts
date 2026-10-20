import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);

  const update: { title?: string; note?: string | null; dueAt?: Date; done?: boolean } = {};
  if (typeof data?.title === "string") update.title = data.title.trim();
  if (typeof data?.note === "string" || data?.note === null) update.note = data.note;
  if (typeof data?.dueAt === "string") {
    const dueAt = new Date(data.dueAt);
    if (Number.isNaN(dueAt.getTime())) {
      return NextResponse.json({ error: "Invalid dueAt date." }, { status: 400 });
    }
    update.dueAt = dueAt;
  }
  if (typeof data?.done === "boolean") update.done = data.done;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const reminder = await prisma.reminder.update({ where: { id }, data: update }).catch(() => null);
  if (!reminder) return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
  return NextResponse.json({ reminder });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.reminder.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
