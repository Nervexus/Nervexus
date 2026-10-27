import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);
  const update: { name?: string; notes?: string | null; day?: boolean; night?: boolean; cold?: boolean } = {};
  if (typeof data?.name === "string" && data.name.trim()) update.name = data.name.trim().slice(0, 80);
  if (typeof data?.notes === "string") update.notes = data.notes.trim().slice(0, 300) || null;
  for (const k of ["day", "night", "cold"] as const) if (typeof data?.[k] === "boolean") update[k] = data[k];
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  const oil = await prisma.fragrance.update({ where: { id }, data: update }).catch(() => null);
  if (!oil) return NextResponse.json({ error: "Oil not found." }, { status: 404 });
  return NextResponse.json({ oil });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.fragrance.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
