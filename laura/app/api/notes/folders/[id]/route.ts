import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin, verifyPin } from "@/lib/pin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);

  const folder = await prisma.noteFolder.findUnique({ where: { id } });
  if (!folder) return NextResponse.json({ error: "Folder not found." }, { status: 404 });

  const name = typeof data?.name === "string" ? data.name.trim() : undefined;
  const pin = typeof data?.pin === "string" ? data.pin.trim() : undefined;
  const currentPin = typeof data?.currentPin === "string" ? data.currentPin.trim() : "";
  const removeLock = data?.removeLock === true;
  const ART = new Set(["mono", "aurora", "ember", "dusk", "glacier", "verdant"]);

  const update: { name?: string; locked?: boolean; pinHash?: string | null; pinSalt?: string | null; art?: string; tone?: string } = {};
  if (name) update.name = name;
  if (typeof data?.art === "string" && ART.has(data.art)) update.art = data.art;
  if (data?.tone === "light" || data?.tone === "dark") update.tone = data.tone;

  if (removeLock || pin) {
    if (folder.locked && folder.pinHash && folder.pinSalt) {
      if (!verifyPin(currentPin, folder.pinHash, folder.pinSalt)) {
        return NextResponse.json({ error: "That PIN is wrong." }, { status: 401 });
      }
    }
    if (removeLock) {
      update.locked = false;
      update.pinHash = null;
      update.pinSalt = null;
    } else if (pin) {
      const { hash, salt } = hashPin(pin);
      update.locked = true;
      update.pinHash = hash;
      update.pinSalt = salt;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await prisma.noteFolder.update({ where: { id }, data: update });
  return NextResponse.json({ folder: { id: updated.id, name: updated.name, locked: updated.locked, art: updated.art, tone: updated.tone } });
}
