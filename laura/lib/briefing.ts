import { prisma } from "@/lib/db";
import { planCommute } from "@/lib/rota";

export type TomorrowBriefing = {
  date: string; // ISO date, local midnight for "tomorrow"
  shift: {
    id: string;
    startAt: string;
    endAt: string;
    location: string | null;
    colleagues: string | null;
    commutePlan: string | null;
  } | null;
  reminders: { id: string; title: string; note: string | null; priority: string }[];
  summary: string;
};

function dayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

/** Pulls tomorrow's shift (with a commute plan, computing one on the fly if
 * it's missing and addresses are set) and tomorrow's reminders into a
 * single plain-text summary -- the one-stop answer to "what does tomorrow
 * look like". Read-only on reminders; only writes if it has to compute a
 * fresh commute plan (same write planCommute already does on its own). */
export async function getTomorrowBriefing(): Promise<TomorrowBriefing> {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const { start, end } = dayRange(tomorrow);

  const [shift, reminders] = await Promise.all([
    prisma.shift.findFirst({ where: { startAt: { gte: start, lt: end } }, orderBy: { startAt: "asc" } }),
    prisma.reminder.findMany({
      where: { done: false, dueAt: { gte: start, lt: end } },
      orderBy: { dueAt: "asc" },
    }),
  ]);

  let commutePlan = shift?.commutePlan ?? null;
  if (shift && !commutePlan) {
    try {
      commutePlan = await planCommute(shift.id);
    } catch (err) {
      console.error("briefing: commute planning failed:", err);
    }
  }

  const parts: string[] = [];
  if (shift) {
    const time = `${shift.startAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}–${shift.endAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    parts.push(
      `Shift ${time}` +
        (shift.location ? ` at ${shift.location}` : "") +
        (shift.colleagues ? `, with ${shift.colleagues}` : "") +
        "."
    );
    if (commutePlan) parts.push(commutePlan);
  } else {
    parts.push("No shift on the rota.");
  }

  if (reminders.length > 0) {
    parts.push(
      `${reminders.length} reminder${reminders.length === 1 ? "" : "s"}: ` +
        reminders.map((r) => r.title).join(", ") +
        "."
    );
  }

  return {
    date: start.toISOString(),
    shift: shift
      ? {
          id: shift.id,
          startAt: shift.startAt.toISOString(),
          endAt: shift.endAt.toISOString(),
          location: shift.location,
          colleagues: shift.colleagues,
          commutePlan,
        }
      : null,
    reminders: reminders.map((r) => ({ id: r.id, title: r.title, note: r.note, priority: r.priority })),
    summary: parts.join(" "),
  };
}
