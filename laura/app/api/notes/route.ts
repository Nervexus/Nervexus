import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const notes = await prisma.note.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const title = typeof data?.title === "string" ? data.title.trim() : "";
  const body = typeof data?.body === "string" ? data.body : "";
  const folderId = typeof data?.folderId === "string" && data.folderId ? data.folderId : "default";

  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }

  const note = await prisma.note.create({ data: { title, body, folderId } });
  return NextResponse.json({ note }, { status: 201 });
}
