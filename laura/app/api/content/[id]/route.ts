import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

const TYPES = new Set(["post", "reel", "story", "other"]);
const STATUSES = new Set(["idea", "scheduled", "posted", "discarded"]);

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);

  const update: {
    title?: string;
    type?: string;
    status?: string;
    caption?: string | null;
    hashtags?: string | null;
    location?: string | null;
    outfit?: string | null;
    scheduledAt?: Date | null;
    note?: string | null;
  } = {};
  if (typeof data?.title === "string" && data.title.trim()) update.title = data.title.trim();
  if (TYPES.has(data?.type)) update.type = data.type;
  if (STATUSES.has(data?.status)) update.status = data.status;
  if (typeof data?.caption === "string" || data?.caption === null) update.caption = data.caption;
  if (typeof data?.hashtags === "string" || data?.hashtags === null) update.hashtags = data.hashtags;
  if (typeof data?.location === "string" || data?.location === null) update.location = data.location;
  if (typeof data?.outfit === "string" || data?.outfit === null) update.outfit = data.outfit;
  if (typeof data?.scheduledAt === "string" || data?.scheduledAt === null) {
    const scheduledAt = data?.scheduledAt ? new Date(data.scheduledAt) : null;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Invalid scheduledAt." }, { status: 400 });
    }
    update.scheduledAt = scheduledAt;
  }
  if (typeof data?.note === "string" || data?.note === null) update.note = data.note;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const idea = await prisma.contentIdea.update({ where: { id }, data: update }).catch(() => null);
  if (!idea) return NextResponse.json({ error: "Content idea not found." }, { status: 404 });
  return NextResponse.json({ idea });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.contentIdea.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
