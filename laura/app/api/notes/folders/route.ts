import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin } from "@/lib/pin";

export async function GET() {
  const folders = await prisma.noteFolder.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { notes: true } } },
  });
  return NextResponse.json({
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      locked: f.locked,
      noteCount: f._count.notes,
    })),
  });
}

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const name = typeof data?.name === "string" ? data.name.trim() : "";
  const pin = typeof data?.pin === "string" ? data.pin.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "A folder name is required." }, { status: 400 });
  }

  const locked = pin.length > 0;
  const { hash, salt } = locked ? hashPin(pin) : { hash: null, salt: null };

  const folder = await prisma.noteFolder.create({
    data: { name, locked, pinHash: hash, pinSalt: salt },
  });
  return NextResponse.json(
    { folder: { id: folder.id, name: folder.name, locked: folder.locked, noteCount: 0 } },
    { status: 201 }
  );
}
