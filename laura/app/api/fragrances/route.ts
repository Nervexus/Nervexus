import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const oils = await prisma.fragrance.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ oils });
}

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const name = typeof data?.name === "string" ? data.name.trim().slice(0, 80) : "";
  if (!name) return NextResponse.json({ error: "A name is required." }, { status: 400 });
  const oil = await prisma.fragrance.create({
    data: {
      name,
      notes: typeof data?.notes === "string" && data.notes.trim() ? data.notes.trim().slice(0, 300) : null,
      day: data?.day === true,
      night: data?.night === true,
      cold: data?.cold === true,
    },
  });
  return NextResponse.json({ oil }, { status: 201 });
}
