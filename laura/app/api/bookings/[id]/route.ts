import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

const CATEGORIES = new Set(["restaurant", "activity", "travel", "other"]);
const STATUSES = new Set(["idea", "pending", "confirmed", "cancelled"]);

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);

  const update: {
    title?: string;
    category?: string;
    status?: string;
    dateTime?: Date | null;
    partySize?: number | null;
    location?: string | null;
    link?: string | null;
    note?: string | null;
  } = {};
  if (typeof data?.title === "string" && data.title.trim()) update.title = data.title.trim();
  if (CATEGORIES.has(data?.category)) update.category = data.category;
  if (STATUSES.has(data?.status)) update.status = data.status;
  if (typeof data?.dateTime === "string" || data?.dateTime === null) {
    const dateTime = data?.dateTime ? new Date(data.dateTime) : null;
    if (dateTime && Number.isNaN(dateTime.getTime())) {
      return NextResponse.json({ error: "Invalid dateTime." }, { status: 400 });
    }
    update.dateTime = dateTime;
  }
  if (typeof data?.partySize === "number" || data?.partySize === null) update.partySize = data.partySize;
  if (typeof data?.location === "string" || data?.location === null) update.location = data.location;
  if (typeof data?.link === "string" || data?.link === null) update.link = data.link;
  if (typeof data?.note === "string" || data?.note === null) update.note = data.note;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const booking = await prisma.booking.update({ where: { id }, data: update }).catch(() => null);
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  return NextResponse.json({ booking });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.booking.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
