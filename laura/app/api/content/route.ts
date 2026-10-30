import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const ideas = await prisma.contentIdea.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ideas });
}

const TYPES = new Set(["post", "reel", "story", "other"]);
const STATUSES = new Set(["idea", "scheduled", "posted", "discarded"]);

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const title = typeof data?.title === "string" ? data.title.trim() : "";
  const type = TYPES.has(data?.type) ? data.type : "post";
  const status = STATUSES.has(data?.status) ? data.status : "idea";
  const caption = typeof data?.caption === "string" ? data.caption.trim() || null : null;
  const hashtags = typeof data?.hashtags === "string" ? data.hashtags.trim() || null : null;
  const location = typeof data?.location === "string" ? data.location.trim() || null : null;
  const outfit = typeof data?.outfit === "string" ? data.outfit.trim() || null : null;
  const scheduledAt = typeof data?.scheduledAt === "string" ? new Date(data.scheduledAt) : null;
  const note = typeof data?.note === "string" ? data.note.trim() || null : null;

  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledAt." }, { status: 400 });
  }

  const idea = await prisma.contentIdea.create({
    data: { title, type, status, caption, hashtags, location, outfit, scheduledAt, note },
  });
  return NextResponse.json({ idea }, { status: 201 });
}
