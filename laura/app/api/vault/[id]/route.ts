import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";

type RouteContext = { params: Promise<{ id: string }> };

// The only endpoint that ever decrypts and returns a secret -- fetching
// one specific item, by id, on explicit request (e.g. the user clicking
// "reveal" on that one row). Never bundled into the list response.
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const item = await prisma.vaultItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });

  try {
    const secret = decrypt(item);
    return NextResponse.json({ id: item.id, title: item.title, secret });
  } catch (error) {
    console.error("Vault decrypt error:", error);
    return NextResponse.json({ error: "Couldn't decrypt this item." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);

  const update: { title?: string; cipherText?: string; iv?: string; authTag?: string } = {};
  if (typeof data?.title === "string") update.title = data.title.trim();
  if (typeof data?.secret === "string" && data.secret) {
    const { cipherText, iv, authTag } = encrypt(data.secret);
    Object.assign(update, { cipherText, iv, authTag });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const item = await prisma.vaultItem
    .update({
      where: { id },
      data: update,
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    })
    .catch(() => null);
  if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.vaultItem.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
