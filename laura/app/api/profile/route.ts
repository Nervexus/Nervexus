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

  const update: Record<string, string | number | boolean | null> = {};
  if (typeof data?.homeAddress === "string" || data?.homeAddress === null) {
    update.homeAddress = data.homeAddress?.trim() || null;
  }
  if (typeof data?.workAddress === "string" || data?.workAddress === null) {
    update.workAddress = data.workAddress?.trim() || null;
  }
  if (typeof data?.arrivalBufferMinutes === "number" && data.arrivalBufferMinutes >= 0) {
    update.arrivalBufferMinutes = Math.round(data.arrivalBufferMinutes);
  }

  // Texting style and daily message settings.
  const pick = (key: string, allowed: string[]) => {
    if (typeof data?.[key] === "string" && allowed.includes(data[key])) update[key] = data[key];
  };
  pick("textStyle", ["pa", "mate", "calm", "minimal"]);
  pick("textLength", ["short", "normal"]);
  pick("motivationTone", ["harsh", "firm", "gentle"]);
  for (const key of ["textEmoji", "morningOn", "afternoonOn", "nightOn", "motivation"]) {
    if (typeof data?.[key] === "boolean") update[key] = data[key];
  }
  if (typeof data?.textNotes === "string" || data?.textNotes === null) {
    update.textNotes = data.textNotes?.trim().slice(0, 600) || null;
  }
  for (const key of ["morningTime", "afternoonTime", "nightTime"]) {
    if (typeof data?.[key] === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(data[key])) {
      update[key] = data[key];
    }
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
