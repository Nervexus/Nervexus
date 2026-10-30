import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const data = await request.json().catch(() => null);
  if (data?.status !== "open" && data?.status !== "done") return NextResponse.json({ error: "status must be open or done" }, { status: 400 });
  const updated = await prisma.devRequest.update({ where: { id }, data: { status: data.status } }).catch(() => null);
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ request: updated });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.devRequest.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
