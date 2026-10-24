import { NextResponse } from "next/server";
import { getTomorrowBriefing } from "@/lib/briefing";

export async function GET() {
  try {
    const briefing = await getTomorrowBriefing();
    return NextResponse.json({ briefing });
  } catch (err) {
    console.error("GET /api/briefing failed:", err);
    return NextResponse.json({ error: "Couldn't build tomorrow's briefing." }, { status: 500 });
  }
}
