import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const profile = await prisma.profile.upsert({
    where: { id: "me" },
    create: { id: "me" },
    update: {},
  });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const data = await request.json().catch(() => null);

  const update: {
    homeAddress?: string | null;
    workAddress?: string | null;
    arrivalBufferMinutes?: number;
  } = {};
  if (typeof data?.homeAddress === "string" || data?.homeAddress === null) {
    update.homeAddress = data.homeAddress?.trim() || null;
  }
  if (typeof data?.workAddress === "string" || data?.workAddress === null) {
    update.workAddress = data.workAddress?.trim() || null;
  }
  if (typeof data?.arrivalBufferMinutes === "number" && data.arrivalBufferMinutes >= 0) {
    update.arrivalBufferMinutes = Math.round(data.arrivalBufferMinutes);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const profile = await prisma.profile.upsert({
    where: { id: "me" },
    create: { id: "me", ...update },
    update,
  });
  return NextResponse.json({ profile });
}
