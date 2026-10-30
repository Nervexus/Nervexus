import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { maskStored } from "@/lib/api-keys";
import { clearGeminiKeyCache } from "@/lib/gemini";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.apiKey.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const data = await request.json().catch(() => null);
  const updates: { label?: string; active?: boolean } = {};
  if (typeof data?.label === "string" && data.label.trim()) updates.label = data.label.trim();
  if (typeof data?.active === "boolean") updates.active = data.active;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const key = await prisma.apiKey.update({ where: { id }, data: updates });
  clearGeminiKeyCache();
  return NextResponse.json({
    key: {
      id: key.id,
      service: key.service,
      label: key.label,
      maskedKey: maskStored(key.apiKey),
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
  clearGeminiKeyCache();
  return NextResponse.json({ ok: true });
}
