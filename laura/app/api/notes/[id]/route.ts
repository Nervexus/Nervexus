import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);

  const update: { title?: string; body?: string; pinned?: boolean } = {};
  if (typeof data?.title === "string") update.title = data.title.trim();
  if (typeof data?.body === "string") update.body = data.body;
  if (typeof data?.pinned === "boolean") update.pinned = data.pinned;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const note = await prisma.note.update({ where: { id }, data: update }).catch(() => null);
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });
  return NextResponse.json({ note });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.note.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
