"use client";

import { useEffect, useState } from "react";
import { ReminderCard } from "@/components/ReminderCard";
import { PriorityPicker } from "@/components/PriorityPicker";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";

type Reminder = {
  id: string;
  title: string;
  note: string | null;
  dueAt: string;
  done: boolean;
  priority: string;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  normal: "bg-neutral-300",
  low: "bg-neutral-600",
};
const MAX_TAGS_PER_DAY = 3;

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Always 42 cells (6 full weeks) so the grid never reflows height between
 * months -- leading/trailing days from adjacent months are included dimmed,
 * same as a normal calendar app. */
function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ year: number; month: number } | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [newPriority, setNewPriority] = useState("normal");

  // Snapshotted once on mount rather than read via `new Date()` during
  // render -- a bare `new Date()` in a Client Component is flagged by
  // Next's prerender as a non-deterministic value.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
    setToday(now);
  }, []);

  function load() {
    fetch("/api/reminders")
      .then((res) => res.json())
      .then((data) => setReminders(data.reminders ?? []))
      .catch(() => setError("Couldn't load reminders."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  async function addOnSelectedDay() {
    if (!selected || !newTitle.trim()) return;
    setError(null);
    const [hours, minutes] = newTime.split(":").map(Number);
    const due = new Date(selected);
    due.setHours(hours || 0, minutes || 0, 0, 0);

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), dueAt: due.toISOString(), priority: newPriority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save reminder.");
      setNewTitle("");
      setNewTime("09:00");
      setNewPriority("normal");
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

  const byDay = new Map<string, Reminder[]>();
  for (const r of reminders) {
    const key = dateKey(new Date(r.dueAt));
    const list = byDay.get(key) ?? [];
    list.push(r);
    byDay.set(key, list);
  }

  const grid = cursor ? buildMonthGrid(cursor.year, cursor.month) : [];
  const selectedReminders = selected ? (byDay.get(dateKey(selected)) ?? []) : [];

  function changeMonth(delta: number) {
    setCursor((c) => {
      if (!c) return c;
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelected(null);
  }

  return (
    <GsapEntrance className="relative mx-auto max-w-5xl px-6 pb-20">
      <div className="gsap-entrance flex items-center gap-3">
        <h1 className="font-thin text-3xl tracking-tight text-neutral-100">Reminders</h1>
        <Pill>{reminders.filter((r) => !r.done).length} upcoming</Pill>
      </div>
      <p className="gsap-entrance mt-2 text-sm text-neutral-500">
        things to do, set by you or by Laura from a conversation
      </p>

      {error && <p className="gsap-entrance mt-4 text-sm text-red-400">{error}</p>}

      {!loaded || !cursor ? (
        <p className="gsap-entrance mt-10 py-10 text-center text-sm text-neutral-600">Loading…</p>
      ) : (
        <div className="gsap-entrance gradient-border relative mt-8 rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm uppercase tracking-widest text-neutral-200">
              {MONTH_NAMES[cursor.month]} {cursor.year}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition-colors hover:border-neutral-600 hover:text-neutral-100"
              >
                <iconify-icon icon="solar:alt-arrow-left-linear" />
              </button>
              <button
                onClick={() => changeMonth(1)}
                aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition-colors hover:border-neutral-600 hover:text-neutral-100"
              >
                <iconify-icon icon="solar:alt-arrow-right-linear" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-600">
            {WEEKDAYS.map((w) => (
              <div key={w} className="hidden sm:block">
                {w}
              </div>
            ))}
            {WEEKDAYS.map((w) => (
              <div key={w + "-short"} className="sm:hidden">
                {w.slice(0, 1)}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {grid.map((day, i) => {
              const inMonth = day.getMonth() === cursor.month;
              const isToday = today !== null && sameDay(day, today);
              const isSelected = selected && sameDay(day, selected);
              const tags = byDay.get(dateKey(day)) ?? [];
              return (
                <button
                  key={i}
                  onClick={() => setSelected(day)}
                  className={`flex min-h-[72px] flex-col items-start gap-1 rounded-xl border p-2 text-left transition-colors sm:min-h-[92px] ${
                    isSelected
                      ? "border-neutral-100 bg-neutral-900/80"
                      : isToday
                        ? "border-neutral-700 bg-neutral-100 text-neutral-950"
                        : inMonth
                          ? "border-neutral-800/60 bg-neutral-950/40 hover:border-neutral-700"
                          : "border-neutral-900/40 bg-transparent opacity-30"
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday && !isSelected ? "text-neutral-950" : "text-neutral-200"}`}>
                    {day.getDate()}
                  </span>
                  <div className="flex w-full flex-col gap-0.5">
                    {tags.slice(0, MAX_TAGS_PER_DAY).map((r) => (
                      <span
                        key={r.id}
                        className={`flex items-center gap-1 truncate text-[10px] ${
                          r.done
                            ? "text-neutral-600 line-through"
                            : isToday && !isSelected
                              ? "text-neutral-800"
                              : "text-neutral-500"
                        }`}
                      >
                        <span className={`h-1 w-1 shrink-0 rounded-full ${PRIORITY_DOT[r.priority] ?? PRIORITY_DOT.normal}`} />
                        <span className="truncate">{r.title}</span>
                      </span>
                    ))}
                    {tags.length > MAX_TAGS_PER_DAY && (
                      <span className="text-[10px] text-neutral-600">+{tags.length - MAX_TAGS_PER_DAY} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected && (
        <div className="gsap-entrance mt-8">
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-neutral-500">
            {selected.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </h2>

          {selectedReminders.length > 0 && (
            <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
              {selectedReminders.map((r) => (
                <ReminderCard
                  key={r.id}
                  title={r.title}
                  note={r.note}
                  dueAt={r.dueAt}
                  priority={r.priority}
                  done={r.done}
                  overdue={false}
                  onToggleDone={() => toggleDone(r)}
                  onDelete={() => remove(r.id)}
                />
              ))}
            </div>
          )}

          <div className="gradient-border relative rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-5 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Remind me to…"
                className="min-w-0 flex-1 bg-transparent text-sm font-light text-neutral-100 outline-none placeholder:text-neutral-600"
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-lg border border-neutral-800/60 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 outline-none [color-scheme:dark]"
              />
              <PriorityPicker value={newPriority} onChange={setNewPriority} />
              <Button onClick={addOnSelectedDay} disabled={!newTitle.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </GsapEntrance>
  );
}
