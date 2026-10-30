import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function mask(key: string): string {
  if (key.length <= 4) return "••••";
  return "••••" + key.slice(-4);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.apiKey.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const data = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};
  if (typeof data?.label === "string" && data.label.trim()) updates.label = data.label.trim();
  if (typeof data?.priority === "number") updates.priority = data.priority;
  if (typeof data?.active === "boolean") updates.active = data.active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const key = await prisma.apiKey.update({ where: { id }, data: updates });
  return NextResponse.json({
    key: {
      id: key.id,
      service: key.service,
      label: key.label,
      maskedKey: mask(key.apiKey),
      priority: key.priority,
      active: key.active,
      createdAt: key.createdAt.toISOString(),
    },
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.apiKey.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
