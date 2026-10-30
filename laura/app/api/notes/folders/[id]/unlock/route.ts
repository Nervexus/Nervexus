import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPin } from "@/lib/pin";

type RouteContext = { params: Promise<{ id: string }> };

// Checks a PIN against a locked folder. There's no server-side session --
// the Notes page just remembers which folder ids unlocked successfully for
// as long as it stays open.
export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);
  const pin = typeof data?.pin === "string" ? data.pin.trim() : "";

  const folder = await prisma.noteFolder.findUnique({ where: { id } });
  if (!folder) return NextResponse.json({ error: "Folder not found." }, { status: 404 });
  if (!folder.locked || !folder.pinHash || !folder.pinSalt) {
    return NextResponse.json({ ok: true });
  }
  if (!verifyPin(pin, folder.pinHash, folder.pinSalt)) {
    return NextResponse.json({ error: "That PIN is wrong." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
