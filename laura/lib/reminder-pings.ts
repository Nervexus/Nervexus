import { prisma } from "@/lib/db";
import { replyInChat } from "@/lib/telegram";
import { USER_TIMEZONE } from "@/lib/booking-links";

// Texts each reminder on Telegram when it's due. Runs on every scheduler
// tick; a reminder is sent once (notifiedAt), and ones more than 6 hours
// overdue are skipped so a long scheduler outage doesn't fire a backlog.
const LOOKBACK_MS = 6 * 3600_000;

export async function sendDueReminders(): Promise<{ sent: number; failed: number }> {
  const now = new Date();
  const due = await prisma.reminder.findMany({
    where: { done: false, notifiedAt: null, dueAt: { lte: now, gte: new Date(now.getTime() - LOOKBACK_MS) } },
    orderBy: { dueAt: "asc" },
  });
  let sent = 0;
  let failed = 0;
  for (const r of due) {
    const time = r.dueAt.toLocaleTimeString("en-GB", { timeZone: USER_TIMEZONE, hour: "2-digit", minute: "2-digit" });
    const text = `⏰ ${r.title}${r.priority === "high" ? " (important)" : ""}\n${time}${r.note ? `\n\n${r.note}` : ""}`;
    let ok = false;
    try {
      ok = await replyInChat(text);
    } catch (err) {
      console.error("Reminder ping failed:", err);
    }
    if (ok) {
      await prisma.reminder.update({ where: { id: r.id }, data: { notifiedAt: new Date() } });
      sent++;
    } else {
      failed++;
    }
  }
  return { sent, failed };
}
