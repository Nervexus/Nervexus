import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const shifts = await prisma.shift.findMany({ orderBy: { startAt: "asc" } });
  return NextResponse.json({ shifts });
}

const SOURCES = new Set(["manual", "photo"]);

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const startAt = typeof data?.startAt === "string" ? new Date(data.startAt) : null;
  const endAt = typeof data?.endAt === "string" ? new Date(data.endAt) : null;
  const location = typeof data?.location === "string" ? data.location.trim() || null : null;
  const colleagues = typeof data?.colleagues === "string" ? data.colleagues.trim() || null : null;
  const note = typeof data?.note === "string" ? data.note.trim() || null : null;
  const source = SOURCES.has(data?.source) ? data.source : "manual";

  if (!startAt || Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "A valid startAt is required." }, { status: 400 });
  }
  if (!endAt || Number.isNaN(endAt.getTime())) {
    return NextResponse.json({ error: "A valid endAt is required." }, { status: 400 });
  }
  if (endAt <= startAt) {
    return NextResponse.json({ error: "endAt must be after startAt." }, { status: 400 });
  }

  const shift = await prisma.shift.create({
    data: { startAt, endAt, location, colleagues, note, source },
  });
  return NextResponse.json({ shift }, { status: 201 });
}
