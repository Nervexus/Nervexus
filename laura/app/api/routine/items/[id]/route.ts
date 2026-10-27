import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanItem } from "../clean";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const update = cleanItem(await request.json().catch(() => null));
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  const item = await prisma.routineItem.update({ where: { id }, data: update }).catch(() => null);
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.routineItem.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
