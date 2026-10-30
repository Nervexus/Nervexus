import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_PER_NOTE = 12;
// Images arrive already downscaled by the browser; this is a backstop so a
// huge paste can't bloat the row. ~2.2MB of base64 ≈ a 1.6MB image.
const MAX_DATA_LEN = 2_200_000;

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);
  const image = typeof data?.data === "string" ? data.data : "";
  const caption = typeof data?.caption === "string" && data.caption.trim() ? data.caption.trim().slice(0, 300) : null;

  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/.test(image)) {
    return NextResponse.json({ error: "Expected an image." }, { status: 400 });
  }
  if (image.length > MAX_DATA_LEN) {
    return NextResponse.json({ error: "That image is too big even after shrinking. Try a smaller one." }, { status: 413 });
  }

  const note = await prisma.note.findUnique({ where: { id }, include: { _count: { select: { images: true } } } });
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });
  if (note._count.images >= MAX_PER_NOTE) {
    return NextResponse.json({ error: `A note can hold up to ${MAX_PER_NOTE} pictures.` }, { status: 409 });
  }

  const created = await prisma.noteImage.create({ data: { noteId: id, data: image, caption } });
  await prisma.note.update({ where: { id }, data: { updatedAt: new Date() } });
  return NextResponse.json({ image: created }, { status: 201 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);
  const imageId = typeof data?.imageId === "string" ? data.imageId : "";
  if (!imageId) return NextResponse.json({ error: "imageId is required." }, { status: 400 });
  const caption = typeof data?.caption === "string" && data.caption.trim() ? data.caption.trim().slice(0, 300) : null;
  await prisma.noteImage.updateMany({ where: { id: imageId, noteId: id }, data: { caption } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const imageId = new URL(request.url).searchParams.get("imageId") ?? "";
  if (!imageId) return NextResponse.json({ error: "imageId is required." }, { status: 400 });
  await prisma.noteImage.deleteMany({ where: { id: imageId, noteId: id } });
  return NextResponse.json({ ok: true });
}
