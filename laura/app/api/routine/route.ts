import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { outreachStatsOrNull } from "@/lib/hq";
import { buildDay, loadRoutineItems, todayYmd, tomorrowYmd, upcomingKeyDates, upcomingPlans, weekPlan } from "@/lib/routine";

// The Routine page's data: one day's cards (today or tomorrow), the editable
// routine items, the week's rota, key dates, oils, and outreach numbers.
export async function GET(request: Request) {
  const which = new URL(request.url).searchParams.get("day") === "tomorrow" ? "tomorrow" : "today";
  try {
    const [oils, items] = await Promise.all([
      prisma.fragrance.findMany({ orderBy: { createdAt: "asc" } }),
      loadRoutineItems(),
    ]);
    const ymd = which === "tomorrow" ? tomorrowYmd() : todayYmd();
    const [day, week, plans, outreach] = await Promise.all([
      buildDay(ymd, oils, items),
      weekPlan(todayYmd(), 7),
      upcomingPlans(7, oils),
      outreachStatsOrNull(),
    ]);
    return NextResponse.json({ day, items, week, plans, keyDates: upcomingKeyDates(), oils, outreach });
  } catch (err) {
    console.error("GET /api/routine failed:", err);
    return NextResponse.json({ error: "Couldn't load the routine." }, { status: 500 });
  }
}
