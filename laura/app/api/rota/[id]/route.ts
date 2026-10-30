import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);

  const update: {
    startAt?: Date;
    endAt?: Date;
    location?: string | null;
    colleagues?: string | null;
    note?: string | null;
  } = {};
  if (typeof data?.startAt === "string") {
    const startAt = new Date(data.startAt);
    if (Number.isNaN(startAt.getTime())) {
      return NextResponse.json({ error: "Invalid startAt date." }, { status: 400 });
    }
    update.startAt = startAt;
  }
  if (typeof data?.endAt === "string") {
    const endAt = new Date(data.endAt);
    if (Number.isNaN(endAt.getTime())) {
      return NextResponse.json({ error: "Invalid endAt date." }, { status: 400 });
    }
    update.endAt = endAt;
  }
  if (typeof data?.location === "string" || data?.location === null) update.location = data.location;
  if (typeof data?.colleagues === "string" || data?.colleagues === null)
    update.colleagues = data.colleagues;
  if (typeof data?.note === "string" || data?.note === null) update.note = data.note;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const shift = await prisma.shift.update({ where: { id }, data: update }).catch(() => null);
  if (!shift) return NextResponse.json({ error: "Shift not found." }, { status: 404 });
  return NextResponse.json({ shift });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.shift.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
