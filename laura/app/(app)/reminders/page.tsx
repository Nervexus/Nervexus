"use client";

import { useEffect, useRef, useState } from "react";
import { PriorityPicker } from "@/components/PriorityPicker";
import { Pill } from "@/components/Pill";
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
  high: "bg-[var(--calendar-accent)]",
  normal: "bg-neutral-300",
  low: "bg-neutral-600",
};
const MAX_DOTS_PER_DAY = 4;

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Always 42 cells (6 full weeks) so the grid never reflows height between
 * months -- leading/trailing days from adjacent months are included, hatched
 * rather than hidden, same as a normal calendar app. */
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
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  // Esc closes the day popup, same as clicking the backdrop.
  useEffect(() => {
    if (!selected) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  useEffect(() => {
    if (selected) titleInputRef.current?.focus();
  }, [selected]);

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
  const selectedReminders = selected
    ? (byDay.get(dateKey(selected)) ?? []).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    : [];

  function changeMonth(delta: number) {
    setCursor((c) => {
      if (!c) return c;
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function goToToday() {
    if (!today) return;
    setCursor({ year: today.getFullYear(), month: today.getMonth() });
  }

  return (
    <GsapEntrance className="relative mx-auto max-w-5xl px-6 pb-20">
      {/* Ambient background rings -- quiet geometric texture behind the
          card, never competing with the red accent or the grid itself. */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[620px] w-[620px] shrink-0 rounded-full border border-white/[0.04]" />
        <div className="absolute h-[420px] w-[420px] rounded-full border border-white/[0.05]" />
        <div className="absolute h-[240px] w-[240px] rounded-full border border-[var(--calendar-accent)]/10" />
      </div>

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
        <div className="gsap-entrance gradient-border relative mt-8 rounded-2xl border border-neutral-800/60 bg-neutral-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-sm uppercase tracking-widest text-neutral-200">
              {MONTH_NAMES[cursor.month]} {cursor.year}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="rounded-full border border-neutral-700 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wide text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100"
              >
                Today
              </button>
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
              <button
                onClick={() => today && setSelected(today)}
                aria-label="Add a reminder"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--calendar-accent)] text-white transition-opacity hover:opacity-85"
              >
                <iconify-icon icon="solar:add-circle-linear" className="text-lg" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-600">
            {WEEKDAYS.map((w) => (
              <div key={w} className="hidden rounded-full bg-neutral-900/80 py-1 sm:block">
                {w}
              </div>
            ))}
            {WEEKDAYS.map((w) => (
              <div key={w + "-short"} className="rounded-full bg-neutral-900/80 py-1 sm:hidden">
                {w.slice(0, 1)}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {grid.map((day, i) => {
              const inMonth = day.getMonth() === cursor.month;
              const isToday = today !== null && sameDay(day, today);
              const dots = byDay.get(dateKey(day)) ?? [];
              return (
                <button
                  key={i}
                  onClick={() => setSelected(day)}
                  className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1.5 rounded-xl border text-center transition-colors sm:min-h-[72px] ${
                    !inMonth
                      ? "day-hatch border-neutral-900/60 bg-neutral-950/40 text-neutral-700"
                      : isToday
                        ? "border-[var(--calendar-accent)]/50 bg-[var(--calendar-accent)]/15 text-white hover:border-[var(--calendar-accent)]"
                        : "border-neutral-800/60 bg-neutral-900 text-neutral-200 hover:border-neutral-600"
                  }`}
                >
                  <span className="text-xs font-medium">{day.getDate()}</span>
                  {dots.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      {dots.slice(0, MAX_DOTS_PER_DAY).map((r) => (
                        <span
                          key={r.id}
                          className={`h-1 w-1 rounded-full ${r.done ? "bg-neutral-700" : (PRIORITY_DOT[r.priority] ?? PRIORITY_DOT.normal)}`}
                        />
                      ))}
                      {dots.length > MAX_DOTS_PER_DAY && (
                        <span className="text-[8px] leading-none text-neutral-500">+{dots.length - MAX_DOTS_PER_DAY}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-neutral-800/60 pt-4 font-mono text-[10px] uppercase tracking-wide text-neutral-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--calendar-accent)]" /> High
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" /> Normal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-600" /> Low
              </span>
            </div>
            <span>{reminders.filter((r) => !r.done).length} upcoming</span>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-[rise-in_0.2s_ease-out_backwards] w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-100">
                {selected.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
              </h2>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-200"
              >
                <iconify-icon icon="solar:close-circle-linear" className="text-lg" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {selectedReminders.length === 0 ? (
                <p className="rounded-lg bg-neutral-900/60 px-3 py-2.5 text-sm text-neutral-500">
                  Nothing scheduled for this day.
                </p>
              ) : (
                selectedReminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2.5 rounded-lg bg-neutral-900/60 px-3 py-2.5"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[r.priority] ?? PRIORITY_DOT.normal}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${r.done ? "text-neutral-600 line-through" : "text-neutral-100"}`}>
                        {r.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {new Date(r.dueAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleDone(r)}
                      className="shrink-0 text-xs text-neutral-500 hover:text-neutral-200"
                    >
                      {r.done ? "Undo" : "Done"}
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="shrink-0 text-xs text-neutral-500 hover:text-[var(--calendar-accent)]"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2.5 border-t border-neutral-800/60 pt-4">
              <input
                ref={titleInputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOnSelectedDay()}
                placeholder="Remind me to…"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
              />
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 outline-none [color-scheme:dark]"
                />
                <PriorityPicker value={newPriority} onChange={setNewPriority} />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="rounded-full px-4 py-2 font-mono text-xs text-neutral-400 transition-colors hover:text-neutral-100"
              >
                Close
              </button>
              <button
                onClick={addOnSelectedDay}
                disabled={!newTitle.trim()}
                className="rounded-full bg-[var(--calendar-accent)] px-5 py-2 font-mono text-xs text-white transition-opacity hover:opacity-85 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </GsapEntrance>
  );
}
