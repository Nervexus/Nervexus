import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

export async function GET() {
  // Deliberately never returns decrypted values in the list -- a vault
  // item's secret is only ever decrypted one at a time, on explicit
  // request for that one item (see [id]/route.ts).
  const items = await prisma.vaultItem.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const title = typeof data?.title === "string" ? data.title.trim() : "";
  const secret = typeof data?.secret === "string" ? data.secret : "";

  if (!title || !secret) {
    return NextResponse.json({ error: "A title and a secret value are required." }, { status: 400 });
  }

  const { cipherText, iv, authTag } = encrypt(secret);
  const item = await prisma.vaultItem.create({
    data: { title, cipherText, iv, authTag },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ item }, { status: 201 });
}
