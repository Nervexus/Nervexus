"use client";

import { useEffect, useState } from "react";
import { HudCard, HexBadge } from "@/components/HudCard";
import { ClockIcon, CheckIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { SidebarCard, Chip, Stat } from "@/components/SidebarCard";

type Reminder = {
  id: string;
  title: string;
  note: string | null;
  dueAt: string;
  done: boolean;
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

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [dueAt, setDueAt] = useState("");
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
  const overdue = now === null ? 0 : upcoming.filter((r) => new Date(r.dueAt).getTime() < now).length;

  return (
    <div className="flex-1">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="font-semibold tracking-tight">Reminders</h1>
        <p className="text-xs text-neutral-500">
          things to do, set by you or by Laura from a conversation
        </p>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Remind me to…"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-neutral-600"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Extra detail (optional)"
            className="mt-2 w-full bg-transparent text-sm text-neutral-300 outline-none placeholder:text-neutral-600"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {TIME_PRESETS.map((preset) => (
              <Chip key={preset.label} onClick={() => setDueAt(toLocalInputValue(preset.get()))}>
                {preset.label}
              </Chip>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 outline-none [color-scheme:dark]"
            />
            <button
              onClick={add}
              disabled={!title.trim() || !dueAt}
              className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 disabled:opacity-40"
            >
              Set reminder
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0">
            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

            {loaded && reminders.length === 0 ? (
              <EmptyState
                icon={<ClockIcon className="h-5 w-5" />}
                title="No reminders yet"
                description="Set one above, pick a quick time from the sidebar, or just ask Laura."
              />
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {upcoming.map((reminder) => {
                    const isOverdue = now !== null && new Date(reminder.dueAt).getTime() < now;
                    return (
                      <HudCard key={reminder.id}>
                        <div className="flex items-start gap-3">
                          <HexBadge>
                            <ClockIcon className="h-4 w-4" />
                          </HexBadge>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-sm font-medium">{reminder.title}</h3>
                              <div className="flex shrink-0 gap-3 text-xs text-neutral-500">
                                <button
                                  onClick={() => toggleDone(reminder)}
                                  className="hover:text-neutral-200"
                                >
                                  Done
                                </button>
                                <button
                                  onClick={() => remove(reminder.id)}
                                  className="hover:text-red-400"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <p
                              className={`mt-1 text-xs tracking-wide ${
                                isOverdue ? "text-amber-400" : "text-neutral-500"
                              }`}
                            >
                              {isOverdue ? "overdue · " : ""}
                              {new Date(reminder.dueAt).toLocaleString()}
                            </p>
                            {reminder.note && (
                              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-400">
                                {reminder.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </HudCard>
                    );
                  })}
                </div>

                {done.length > 0 && (
                  <div className="mt-8">
                    <h2 className="mb-3 text-xs tracking-wide text-neutral-600">Done</h2>
                    <div className="flex flex-col gap-3">
                      {done.map((reminder) => (
                        <HudCard key={reminder.id} className="opacity-50">
                          <div className="flex items-center gap-3">
                            <HexBadge>
                              <CheckIcon className="h-4 w-4" />
                            </HexBadge>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-medium line-through">{reminder.title}</h3>
                            </div>
                            <div className="flex shrink-0 gap-3 text-xs text-neutral-500">
                              <button
                                onClick={() => toggleDone(reminder)}
                                className="hover:text-neutral-200"
                              >
                                Undo
                              </button>
                              <button onClick={() => remove(reminder.id)} className="hover:text-red-400">
                                Delete
                              </button>
                            </div>
                          </div>
                        </HudCard>
                      ))}
                    </div>
                  </div>
                )}
              </>
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
                <Stat label="Overdue" value={overdue} />
                <Stat label="Done" value={done.length} />
              </div>
            </SidebarCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
