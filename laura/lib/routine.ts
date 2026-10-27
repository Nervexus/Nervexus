import { prisma } from "@/lib/db";
import { USER_TIMEZONE } from "@/lib/booking-links";

// Madoxs's daily routine: skincare, hair/beard, fragrance, work blocks and
// key dates, fitted around whatever shifts are on the rota. The fixed parts
// (products, which days, which dates) live here as plain data so they're
// easy to change; shifts, bookings and perfume oils come from the database.

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------- time helpers (servers run on UTC; the user is in the UK) ----------

function localParts(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: USER_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value])
  );
  return {
    ymd: `${p.year}-${p.month}-${p.day}`,
    month: Number(p.month),
    hour: Number(p.hour),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday),
  };
}

/** The UTC instant of local midnight for a "YYYY-MM-DD" date. */
function localMidnight(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  // How far the local clock is ahead of UTC at that moment (0 or 1h in the UK).
  const p = localParts(new Date(guess));
  const [ly, lm, ld] = p.ymd.split("-").map(Number);
  const asUtc = Date.UTC(ly, lm - 1, ld, p.hour);
  return new Date(guess - (asUtc - guess));
}

function addDays(ymd: string, n: number): string {
  return localParts(new Date(localMidnight(ymd).getTime() + n * DAY_MS + 12 * 60 * 60 * 1000)).ymd;
}

function daysBetween(fromYmd: string, toYmd: string): number {
  return Math.round((Date.parse(toYmd) - Date.parse(fromYmd)) / DAY_MS);
}

/** "2pm", "6:30am" in the user's timezone. */
export function shortTime(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: USER_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .replace(":00", "")
    .replace(/\s/g, "");
}

function dayLabel(ymd: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${ymd}T12:00:00Z`));
}

// ---------- the fixed routine ----------

export const KEY_DATES: { date: string; until?: string; items: string[] }[] = [
  { date: "2026-10-30", items: ["Payday", "Haircut (hair only, leave the beard)", "Book the Budapest flight"] },
  { date: "2026-11-27", items: ["Barber: trim to a short boxed beard", "Black Friday"] },
  { date: "2026-11-30", items: ["Payday", "Pay the hotel balance"] },
  { date: "2026-12-03", items: ["Pack for Budapest"] },
  { date: "2026-12-04", until: "2026-12-08", items: ["Budapest"] },
];

const BARBER_DATE = "2026-11-27";
const HAIRCUT_DATE = "2026-10-30";

/** Nutmeg exfoliator nights (Mon, Wed, Sat): 3x a week, and on those nights
 * it replaces the Clean & Clear wash, never on top of it. */
const EXFOLIATE_DAYS = new Set([1, 3, 6]);

type Block = { title: string; detail: string };
const WORK_BLOCKS: Record<number, Block> = {
  1: { title: "Outreach, 10 messages", detail: "Roofers, £250 sites. Note who replies." },
  3: { title: "Outreach, 10 messages", detail: "Roofers, £250 sites. Follow up Monday's." },
  5: { title: "Outreach, 10 messages", detail: "Roofers, £250 sites. Chase anyone warm." },
  2: { title: "Driving theory, 30 min", detail: "One mock test plus hazard perception clips." },
  4: { title: "Driving theory, 30 min", detail: "Redo the questions you got wrong Tuesday." },
  0: {
    title: "Weekly review, 20 min",
    detail: "Leads and replies, theory scores, 2-bed rentals near Waterside, money vs car fund.",
  },
};

// ---------- types ----------

export type Step = { id: string; text: string };
export type Oil = { id: string; name: string; notes: string | null; day: boolean; night: boolean; cold: boolean };
export type Pick = { oil: Oil | null; why: string };
export type Plan = { when: string; title: string; kind: "shift" | "booking" | "trip"; pick: Pick };

export type RoutineDay = {
  date: string;
  label: string;
  shift: { start: string; end: string; startAt: string; endAt: string; location: string | null } | null;
  morning: Step[];
  night: Step[];
  block: (Block & { when: string }) | null;
  hair: { headline: string; detail: string };
  wear: Pick;
  today: string[];
  tomorrow: { shift: string | null; items: string[]; alarm: string | null };
};

// ---------- fragrance ----------

function isCold(month: number): boolean {
  return month >= 10 || month <= 3;
}

/** Best oil for a plan: night/day fit counts most, cold weather next. Ties
 * rotate by date so you're not wearing the same one every day. */
export function pickOil(oils: Oil[], opts: { night: boolean; cold: boolean; seed: number }): Pick {
  if (oils.length === 0) return { oil: null, why: "Add your oils to get a pick." };
  const score = (o: Oil) => (opts.night ? (o.night ? 2 : 0) : o.day ? 2 : 0) + (opts.cold && o.cold ? 1 : 0);
  const best = Math.max(...oils.map(score));
  const top = oils.filter((o) => score(o) === best);
  const oil = top[opts.seed % top.length];
  const fits = [
    (opts.night ? oil.night : oil.day) ? (opts.night ? "night" : "day") : null,
    opts.cold && oil.cold ? "cold weather" : null,
  ].filter(Boolean);
  return { oil, why: fits.length ? `Good for ${fits.join(", ")}.` : "Closest match you own." };
}

// ---------- building a day ----------

async function loadOils(): Promise<Oil[]> {
  return prisma.fragrance.findMany({ orderBy: { createdAt: "asc" } });
}

async function shiftOn(ymd: string) {
  const start = localMidnight(ymd);
  return prisma.shift.findFirst({
    where: { startAt: { gte: start, lt: new Date(start.getTime() + DAY_MS) } },
    orderBy: { startAt: "asc" },
  });
}

function keyItems(ymd: string): string[] {
  return KEY_DATES.flatMap((k) => {
    if (ymd === k.date) return k.items;
    if (k.until && ymd > k.date && ymd <= k.until) return k.items.map((i) => `${i} (day ${daysBetween(k.date, ymd) + 1})`);
    return [];
  });
}

function hairFor(ymd: string): { headline: string; detail: string } {
  const curls = "Curly hair: no taper fade, keep the curls.";
  if (ymd === HAIRCUT_DATE) return { headline: "Haircut today", detail: `${curls} Leave the beard, it's growing till 27 Nov.` };
  const toBarber = daysBetween(ymd, BARBER_DATE);
  if (toBarber > 0)
    return {
      headline: `Growing the beard: ${toBarber} day${toBarber === 1 ? "" : "s"} to the barber`,
      detail: `No trims till 27 Nov. ${curls}`,
    };
  if (toBarber === 0)
    return { headline: "Barber today", detail: `Trim to a short boxed beard. ${curls}` };
  return { headline: "Short boxed beard", detail: `Tidy the lines once a week. ${curls}` };
}

export async function buildDay(ymd: string, oils?: Oil[]): Promise<RoutineDay> {
  const date = localMidnight(ymd);
  const { weekday, month } = localParts(new Date(date.getTime() + 12 * 60 * 60 * 1000));
  const tomorrowYmd = addDays(ymd, 1);
  const [shift, nextShift, ownedOils] = await Promise.all([shiftOn(ymd), shiftOn(tomorrowYmd), oils ?? loadOils()]);

  const exfoliate = EXFOLIATE_DAYS.has(weekday);
  const morning: Step[] = [
    { id: "am-wash", text: "Clean & Clear wash" },
    { id: "am-eye", text: "Caffeine eye serum, tap under the eyes" },
    { id: "am-moist", text: "Mattifying moisturiser" },
    { id: "am-spf", text: "SPF, every morning" },
    { id: "am-oil", text: "Perfume oil once dressed" },
  ];
  const night: Step[] = [
    exfoliate
      ? { id: "pm-wash", text: "Nutmeg exfoliator (no Clean & Clear tonight)" }
      : { id: "pm-wash", text: "Clean & Clear wash" },
    { id: "pm-moist", text: "Rich moisturiser" },
  ];

  // No work blocks while away (the Budapest trip).
  const away = KEY_DATES.some((k) => k.until && ymd >= k.date && ymd <= k.until);
  const base = away ? undefined : WORK_BLOCKS[weekday];
  const block = base
    ? {
        ...base,
        when: !shift
          ? base.title.startsWith("Weekly") ? "this evening" : "today, any time"
          : // Theory is flexible: on a late shift do it before, not at 10pm.
            !base.title.startsWith("Outreach") && localParts(shift.startAt).hour >= 12
            ? `before your shift (${shortTime(shift.startAt)})`
            : `after your shift (${shortTime(shift.endAt)})`,
      }
    : null;
  if (block) night.push({ id: "pm-block", text: `Done: ${block.title.toLowerCase()}` });

  const alarm = nextShift ? shortTime(new Date(nextShift.startAt.getTime() - 90 * 60 * 1000)) : null;
  if (nextShift) {
    night.push({ id: "pm-alarm", text: `Alarm for ${alarm} (shift ${shortTime(nextShift.startAt)})` });
    night.push({ id: "pm-clothes", text: "Clothes out for tomorrow" });
  }
  night.push({ id: "pm-charge", text: "Phone on charge" });

  const night_ = shift ? localParts(shift.startAt).hour >= 17 : false;
  return {
    date: ymd,
    label: dayLabel(ymd),
    shift: shift
      ? {
          start: shortTime(shift.startAt),
          end: shortTime(shift.endAt),
          startAt: shift.startAt.toISOString(),
          endAt: shift.endAt.toISOString(),
          location: shift.location,
        }
      : null,
    morning,
    night,
    block,
    hair: hairFor(ymd),
    wear: pickOil(ownedOils, { night: night_, cold: isCold(month), seed: Math.floor(date.getTime() / DAY_MS) }),
    today: keyItems(ymd),
    tomorrow: {
      shift: nextShift ? `${shortTime(nextShift.startAt)}–${shortTime(nextShift.endAt)}` : null,
      items: keyItems(tomorrowYmd),
      alarm,
    },
  };
}

export function todayYmd(): string {
  return localParts(new Date()).ymd;
}

export function tomorrowYmd(): string {
  return addDays(todayYmd(), 1);
}

/** The next week's plans (shifts, bookings, the trip), each with an oil pick. */
export async function upcomingPlans(days = 7, oils?: Oil[]): Promise<Plan[]> {
  const owned = oils ?? (await loadOils());
  const from = new Date();
  const to = new Date(localMidnight(todayYmd()).getTime() + days * DAY_MS);
  const [shifts, bookings] = await Promise.all([
    prisma.shift.findMany({ where: { endAt: { gte: from }, startAt: { lt: to } }, orderBy: { startAt: "asc" } }),
    prisma.booking.findMany({
      where: { status: { not: "cancelled" }, dateTime: { gte: from, lt: to } },
      orderBy: { dateTime: "asc" },
    }),
  ]);

  const plan = (at: Date, title: string, kind: Plan["kind"], night: boolean): Plan & { t: number } => {
    const p = localParts(at);
    return {
      t: at.getTime(),
      when: `${dayLabel(p.ymd)}, ${shortTime(at)}`,
      title,
      kind,
      pick: pickOil(owned, { night, cold: isCold(p.month), seed: Math.floor(at.getTime() / DAY_MS) }),
    };
  };

  const out = [
    ...shifts.map((s) => plan(s.startAt, `Shift${s.location ? ` at ${s.location}` : ""}`, "shift", localParts(s.startAt).hour >= 17)),
    ...bookings.map((b) => plan(b.dateTime!, b.title, "booking", localParts(b.dateTime!).hour >= 17)),
  ];
  const today = todayYmd();
  for (const k of KEY_DATES) {
    if (k.until && k.date >= today && daysBetween(today, k.date) < days) {
      out.push({ ...plan(new Date(localMidnight(k.date).getTime() + 9 * 60 * 60 * 1000), k.items[0], "trip", true), when: `${dayLabel(k.date)} – ${dayLabel(k.until)}` });
    }
  }
  return out.sort((a, b) => a.t - b.t).map((p) => ({ when: p.when, title: p.title, kind: p.kind, pick: p.pick }));
}

export function upcomingKeyDates(limit = 6) {
  const today = todayYmd();
  return KEY_DATES.filter((k) => (k.until ?? k.date) >= today)
    .slice(0, limit)
    .map((k) => ({
      date: k.date,
      label: k.until ? `${dayLabel(k.date)} – ${dayLabel(k.until)}` : dayLabel(k.date),
      items: k.items,
      daysAway: Math.max(0, daysBetween(today, k.date)),
    }));
}

// ---------- Telegram messages ----------

export async function morningMessage(): Promise<string> {
  const d = await buildDay(todayYmd());
  const lines = [`Morning. ${d.label}`];
  lines.push(d.shift ? `Shift ${d.shift.start}–${d.shift.end}${d.shift.location ? ` at ${d.shift.location}` : ""}.` : "No shift today.");
  if (d.today.length) lines.push(`Today: ${d.today.join(" · ")}`);
  lines.push("Skin: wash, eye serum, matte moisturiser, SPF.");
  lines.push(d.wear.oil ? `Wear: ${d.wear.oil.name}. ${d.wear.why}` : "Wear: tell me which oils you own and I'll pick.");
  if (d.block) lines.push(`${d.block.title}, ${d.block.when}.`);
  lines.push(d.hair.headline + ".");
  return lines.join("\n");
}

export async function nightMessage(): Promise<string> {
  const d = await buildDay(todayYmd());
  const lines = ["Night checklist", ...d.night.map((s) => `☐ ${s.text}`)];
  const t = d.tomorrow;
  const tomorrow = [t.shift ? `shift ${t.shift}` : "no shift", ...t.items].join(" · ");
  lines.push("", `Tomorrow: ${tomorrow}`);
  return lines.join("\n");
}

/** A local wall-clock time on a date, as a UTC Date. */
export function localTime(ymd: string, hour: number, minute = 0): Date {
  return new Date(localMidnight(ymd).getTime() + (hour * 60 + minute) * 60 * 1000);
}
