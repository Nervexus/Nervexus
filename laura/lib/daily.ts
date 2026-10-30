import { prisma } from "@/lib/db";
import { USER_TIMEZONE } from "@/lib/booking-links";
import { morningMessage, nightMessage, todayYmd } from "@/lib/routine";
import { replyInChat } from "@/lib/telegram";

// Sends the morning and night Telegram texts at the times set in Settings.
// Called every few minutes by a scheduler (cron-job.org -> /api/routine/tick)
// and by Vercel's two daily crons as a fallback. Each text goes out at
// most once a day, and only within 3 hours of its set time, so a late or
// missed tick never sends a morning text at night.

const WINDOW_MIN = 180;

function minutesNow(): number {
  const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: USER_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .format(new Date())
    .split(":")
    .map(Number);
  return h * 60 + m;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export type DailyResult = { morning: "sent" | "not due" | "already sent" | "off" | "failed"; night: DailyResult["morning"] };

export async function runDailyMessages(): Promise<DailyResult> {
  const today = todayYmd();
  const now = minutesNow();
  const profile = await prisma.profile.upsert({ where: { id: "me" }, create: { id: "me" }, update: {} });

  async function maybeSend(part: "morning" | "night"): Promise<DailyResult["morning"]> {
    const on = part === "morning" ? profile.morningOn : profile.nightOn;
    const at = toMinutes(part === "morning" ? profile.morningTime : profile.nightTime);
    const last = part === "morning" ? profile.lastMorningOn : profile.lastNightOn;
    if (!on) return "off";
    if (last === today) return "already sent";
    if (now < at || now >= at + WINDOW_MIN) return "not due";

    // Claim today's slot first so two overlapping ticks can't both send.
    const field = part === "morning" ? "lastMorningOn" : "lastNightOn";
    const claimed = await prisma.profile.updateMany({
      where: { id: "me", OR: [{ [field]: null }, { [field]: { not: today } }] },
      data: { [field]: today },
    });
    if (claimed.count === 0) return "already sent";

    const text =
      part === "morning"
        ? await morningMessage({ motivationTone: profile.motivation ? profile.motivationTone : null })
        : await nightMessage();
    if (await replyInChat(text)) return "sent";
    // Let the next tick try again.
    await prisma.profile.update({ where: { id: "me" }, data: { [field]: last } });
    return "failed";
  }

  return { morning: await maybeSend("morning"), night: await maybeSend("night") };
}
