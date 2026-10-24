import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ bookings });
}

const CATEGORIES = new Set(["restaurant", "activity", "travel", "other"]);
const STATUSES = new Set(["idea", "pending", "confirmed", "cancelled"]);

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const title = typeof data?.title === "string" ? data.title.trim() : "";
  const category = CATEGORIES.has(data?.category) ? data.category : "other";
  const status = STATUSES.has(data?.status) ? data.status : "idea";
  const dateTime = typeof data?.dateTime === "string" ? new Date(data.dateTime) : null;
  const partySize = typeof data?.partySize === "number" ? data.partySize : null;
  const location = typeof data?.location === "string" ? data.location.trim() || null : null;
  const link = typeof data?.link === "string" ? data.link.trim() || null : null;
  const note = typeof data?.note === "string" ? data.note.trim() || null : null;

  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }
  if (dateTime && Number.isNaN(dateTime.getTime())) {
    return NextResponse.json({ error: "Invalid dateTime." }, { status: 400 });
  }

  const booking = await prisma.booking.create({
    data: { title, category, status, dateTime, partySize, location, link, note },
  });
  return NextResponse.json({ booking }, { status: 201 });
}
