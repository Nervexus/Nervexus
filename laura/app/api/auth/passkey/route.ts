import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Lists and removes saved passkeys (signed-in only, via the proxy).
export async function GET() {
  const passkeys = await prisma.passkey.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, label: true, createdAt: true, lastUsedAt: true },
  });
  return NextResponse.json({ passkeys });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  await prisma.passkey.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
