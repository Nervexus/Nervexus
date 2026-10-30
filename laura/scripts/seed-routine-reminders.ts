// Adds the routine's dated reminders (paydays, haircut, flight, barber,
// Budapest...) to the Reminders table. Safe to re-run: anything with the
// same title at the same time is skipped. Run with:
//   npx -y tsx scripts/seed-routine-reminders.ts
import { prisma } from "@/lib/db";
import { localTime } from "@/lib/routine";

const REMINDERS: { date: string; hour: number; title: string; note?: string; priority?: string }[] = [
  { date: "2026-10-30", hour: 9, title: "Payday" },
  { date: "2026-10-30", hour: 12, title: "Haircut", note: "Hair only, no taper fade. Leave the beard, it's growing till 27 Nov." },
  { date: "2026-10-30", hour: 18, title: "Book the Budapest flight", note: "4–8 Dec.", priority: "high" },
  { date: "2026-11-27", hour: 8, title: "Black Friday", note: "Check deals on anything you've been waiting to buy." },
  { date: "2026-11-27", hour: 10, title: "Barber: trim to a short boxed beard", note: "No taper fade, keep the curls." },
  { date: "2026-11-30", hour: 9, title: "Payday" },
  { date: "2026-11-30", hour: 18, title: "Pay the hotel balance", note: "Budapest, 4–8 Dec.", priority: "high" },
  { date: "2026-12-03", hour: 19, title: "Pack for Budapest", note: "Passport, chargers, adaptor, skincare, oils." },
  { date: "2026-12-04", hour: 7, title: "Budapest trip starts", note: "Back 8 Dec." },
];

async function main() {
  let added = 0;
  for (const r of REMINDERS) {
    const dueAt = localTime(r.date, r.hour);
    const exists = await prisma.reminder.findFirst({ where: { title: r.title, dueAt } });
    if (exists) continue;
    await prisma.reminder.create({
      data: { title: r.title, note: r.note ?? null, dueAt, priority: r.priority ?? "normal" },
    });
    added++;
  }
  console.log(`Added ${added} reminder(s), skipped ${REMINDERS.length - added} already there.`);
}

main().finally(() => prisma.$disconnect());
