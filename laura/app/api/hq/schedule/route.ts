import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hqAuthorized } from "@/lib/hq";
import { KEY_DATES, addDays, localTime, todayYmd } from "@/lib/routine";

const DAY_START = 9; // earliest call time
const DAY_END = 19; // latest call time
const AFTER_SHIFT_MIN = 30; // time to get home after a shift

// Free time for calls over the next few days: 9am-7pm UK, minus shifts
// (plus travel either side) and days away. Shape agreed with the outreach
// app: { free: [{ start, end }] } in ISO times, plus the shifts themselves.
export async function GET(request: Request) {
  if (!hqAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const days = Math.min(Math.max(Number(new URL(request.url).searchParams.get("days")) || 7, 1), 14);

  const today = todayYmd();
  const from = localTime(today, 0);
  const to = localTime(addDays(today, days), 0);
  const [shifts, profile] = await Promise.all([
    prisma.shift.findMany({ where: { endAt: { gt: from }, startAt: { lt: to } }, orderBy: { startAt: "asc" } }),
    prisma.profile.findUnique({ where: { id: "me" } }),
  ]);
  const beforeMin = Math.max(profile?.arrivalBufferMinutes ?? 15, 30) + 15; // get ready and travel

  const now = Date.now();
  const free: { start: string; end: string }[] = [];
  for (let i = 0; i < days; i++) {
    const ymd = addDays(today, i);
    if (KEY_DATES.some((k) => k.until && ymd >= k.date && ymd <= k.until)) continue; // away
    let windows: [number, number][] = [[localTime(ymd, DAY_START).getTime(), localTime(ymd, DAY_END).getTime()]];
    for (const s of shifts) {
      const busyFrom = s.startAt.getTime() - beforeMin * 60_000;
      const busyTo = s.endAt.getTime() + AFTER_SHIFT_MIN * 60_000;
      windows = windows.flatMap(([a, b]): [number, number][] =>
        busyTo <= a || busyFrom >= b ? [[a, b]] : ([[a, Math.min(b, busyFrom)], [Math.max(a, busyTo), b]] as [number, number][]).filter(([x, y]) => y - x >= 30 * 60_000)
      );
    }
    for (const [a, b] of windows) {
      const start = Math.max(a, now);
      if (b - start >= 30 * 60_000) free.push({ start: new Date(start).toISOString(), end: new Date(b).toISOString() });
    }
  }
  return NextResponse.json({
    free,
    shifts: shifts.map((s) => ({ start: s.startAt.toISOString(), end: s.endAt.toISOString() })),
  });
}
