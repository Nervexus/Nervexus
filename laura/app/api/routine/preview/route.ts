import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { morningMessage, nightMessage } from "@/lib/routine";

// Settings' Preview button: the text as it would go out now, without sending it.
export async function GET(request: Request) {
  const part = new URL(request.url).searchParams.get("part") === "night" ? "night" : "morning";
  try {
    const profile = await prisma.profile.findUnique({ where: { id: "me" } });
    const tone = profile && !profile.motivation ? null : (profile?.motivationTone ?? "harsh");
    const text = part === "morning" ? await morningMessage({ motivationTone: tone }) : await nightMessage();
    return NextResponse.json({ text });
  } catch (err) {
    console.error("routine preview failed:", err);
    return NextResponse.json({ error: "Couldn't build the preview." }, { status: 500 });
  }
}
