import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { outreachStatsOrNull } from "@/lib/hq";
import { buildDay, todayYmd, tomorrowYmd, upcomingKeyDates, upcomingPlans } from "@/lib/routine";

// The Routine page's data: one day's plan (today or tomorrow), the next
// week's plans with fragrance picks, upcoming key dates, and the oils owned.
export async function GET(request: Request) {
  const which = new URL(request.url).searchParams.get("day") === "tomorrow" ? "tomorrow" : "today";
  try {
    const oils = await prisma.fragrance.findMany({ orderBy: { createdAt: "asc" } });
    const [day, plans, outreach] = await Promise.all([
      buildDay(which === "tomorrow" ? tomorrowYmd() : todayYmd(), oils),
      upcomingPlans(7, oils),
      outreachStatsOrNull(),
    ]);
    return NextResponse.json({ day, plans, keyDates: upcomingKeyDates(), oils, outreach });
  } catch (err) {
    console.error("GET /api/routine failed:", err);
    return NextResponse.json({ error: "Couldn't load the routine." }, { status: 500 });
  }
}
