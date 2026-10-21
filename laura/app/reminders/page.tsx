"use client";

import { useEffect, useState } from "react";
import { ClockIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { SidebarCard, Chip, Stat } from "@/components/SidebarCard";
import { ReminderCard } from "@/components/ReminderCard";
import { PriorityPicker } from "@/components/PriorityPicker";
import { DotGrid } from "@/components/DotGrid";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";

type Reminder = {
  id: string;
  title: string;
  note: string | null;
  dueAt: string;
  done: boolean;
  priority: string;
};

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function inHours(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

function todayOrTomorrowAt(hour: number): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

function tomorrowAt(hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function nextWeekday(targetDay: number, hour: number): Date {
  const d = new Date();
  const diff = (targetDay - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const TIME_PRESETS: { label: string; get: () => Date }[] = [
  { label: "In 1 hour", get: () => inHours(1) },
  { label: "This evening", get: () => todayOrTomorrowAt(19) },
  { label: "Tomorrow 9am", get: () => tomorrowAt(9) },
  { label: "This weekend", get: () => nextWeekday(6, 10) },
  { label: "Next week", get: () => nextWeekday(1, 9) },
];

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupByWhen(upcoming: Reminder[], now: number) {
  const todayEnd = startOfDay(now) + 24 * 60 * 60 * 1000;
  const weekEnd = startOfDay(now) + 7 * 24 * 60 * 60 * 1000;

  const overdue: Reminder[] = [];
  const today: Reminder[] = [];
  const thisWeek: Reminder[] = [];
  const later: Reminder[] = [];

  for (const r of upcoming) {
    const t = new Date(r.dueAt).getTime();
    if (t < now) overdue.push(r);
    else if (t < todayEnd) today.push(r);
    else if (t < weekEnd) thisWeek.push(r);
    else later.push(r);
  }
  return { overdue, today, thisWeek, later };
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("normal");
  const [error, setError] = useState<string | null>(null);
  // Snapshotted once on mount rather than read via Date.now() during
  // render, which React's purity rules flag as an impure render.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  function load() {
    fetch("/api/reminders")
      .then((res) => res.json())
      .then((data) => setReminders(data.reminders ?? []))
      .catch(() => setError("Couldn't load reminders."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  function resetForm() {
    setTitle("");
    setNote("");
    setDueAt("");
    setPriority("normal");
  }

  async function add() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !dueAt) return;
    setError(null);

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          note: note || undefined,
          dueAt: new Date(dueAt).toISOString(),
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save reminder.");
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save reminder.");
    }
  }

  async function toggleDone(reminder: Reminder) {
    await fetch(`/api/reminders/${reminder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !reminder.done }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    load();
  }

  const upcoming = reminders.filter((r) => !r.done);
  const done = reminders.filter((r) => r.done);
  const groups = now === null ? null : groupByWhen(upcoming, now);
  const overdueCount = groups?.overdue.length ?? 0;

  const SECTIONS: { key: keyof NonNullable<typeof groups>; label: string }[] = [
    { key: "overdue", label: "Overdue" },
    { key: "today", label: "Today" },
    { key: "thisWeek", label: "This week" },
    { key: "later", label: "Later" },
  ];

  return (
    <div className="flex-1">
      <div className="relative overflow-hidden border-b border-neutral-800 px-8 pb-10 pt-8">
        <DotGrid />
        <div className="relative mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-neutral-50">Reminders</h1>
            <Pill>{upcoming.length} upcoming</Pill>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            things to do, set by you or by Laura from a conversation
          </p>

          <div className="relative mt-7 rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 sm:p-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Remind me to…"
              className="w-full bg-transparent text-base font-medium outline-none placeholder:text-neutral-600"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Extra detail (optional)"
              className="mt-2.5 w-full bg-transparent text-sm text-neutral-300 outline-none placeholder:text-neutral-600"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {TIME_PRESETS.map((preset) => (
                <Chip key={preset.label} onClick={() => setDueAt(toLocalInputValue(preset.get()))}>
                  {preset.label}
                </Chip>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 outline-none [color-scheme:dark]"
                />
                <PriorityPicker value={priority} onChange={setPriority} />
              </div>
              <Button onClick={add} disabled={!title.trim() || !dueAt}>
                Set reminder
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

            {loaded && reminders.length === 0 ? (
              <EmptyState
                icon={<ClockIcon className="h-5 w-5" />}
                title="No reminders yet"
                description="Set one above, pick a quick time from the sidebar, or just ask Laura."
              />
            ) : (
              groups && (
                <>
                  {SECTIONS.map(({ key, label }) => {
                    const items = groups[key];
                    if (items.length === 0) return null;
                    return (
                      <div key={key} className="mb-8">
                        <h2
                          className={`mb-3 font-mono text-[11px] uppercase tracking-widest ${
                            key === "overdue" ? "text-amber-400" : "text-neutral-500"
                          }`}
                        >
                          {label} · {items.length}
                        </h2>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3">
                          {items.map((reminder) => (
                            <ReminderCard
                              key={reminder.id}
                              title={reminder.title}
                              note={reminder.note}
                              dueAt={reminder.dueAt}
                              priority={reminder.priority}
                              done={false}
                              overdue={key === "overdue"}
                              onToggleDone={() => toggleDone(reminder)}
                              onDelete={() => remove(reminder.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {done.length > 0 && (
                    <div>
                      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-neutral-600">
                        Done · {done.length}
                      </h2>
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3">
                        {done.map((reminder) => (
                          <ReminderCard
                            key={reminder.id}
                            title={reminder.title}
                            note={reminder.note}
                            dueAt={reminder.dueAt}
                            priority={reminder.priority}
                            done
                            overdue={false}
                            onToggleDone={() => toggleDone(reminder)}
                            onDelete={() => remove(reminder.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <SidebarCard title="Quick add">
              <div className="flex flex-wrap gap-2">
                {TIME_PRESETS.map((preset) => (
                  <Chip key={preset.label} onClick={() => setDueAt(toLocalInputValue(preset.get()))}>
                    {preset.label}
                  </Chip>
                ))}
              </div>
            </SidebarCard>

            <SidebarCard title="Stats">
              <div className="flex flex-col gap-2">
                <Stat label="Upcoming" value={upcoming.length} />
                <Stat label="Overdue" value={overdueCount} />
                <Stat label="Done" value={done.length} />
              </div>
            </SidebarCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
