"use client";

import { useEffect, useRef, useState } from "react";
import { PriorityPicker } from "@/components/PriorityPicker";
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

  const upcoming = reminders.filter((r) => !r.done);
  const monthDays = cursor ? new Date(cursor.year, cursor.month + 1, 0).getDate() : 30;
  const nextUp = today
    ? upcoming
        .filter((r) => new Date(r.dueAt).getTime() >= today.getTime() - 60_000)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
        .slice(0, 4)
    : [];
  const inCursorMonth = (d: Date) => cursor !== null && d.getFullYear() === cursor.year && d.getMonth() === cursor.month;
  const monthCount = upcoming.filter((r) => inCursorMonth(new Date(r.dueAt))).length;
  const todayIndex = today && cursor && inCursorMonth(today) ? today.getDate() - 1 : null;

  return (
    <GsapEntrance className="relative mx-auto max-w-5xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance flex items-end justify-between gap-4">
        <div>
          <p className="label">Reminders</p>
          <h1 className="mt-3 page-title">
            {cursor ? `${MONTH_NAMES[cursor.month]} ${cursor.year}` : " "}
          </h1>
        </div>
        <div className="label flex items-center gap-5 pb-1">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month" className="transition-colors hover:text-neutral-100">
            ←
          </button>
          <button onClick={goToToday} className="transition-colors hover:text-neutral-100">
            Today
          </button>
          <button onClick={() => changeMonth(1)} aria-label="Next month" className="transition-colors hover:text-neutral-100">
            →
          </button>
        </div>
      </div>

      {error && <p className="gsap-entrance mt-4 text-sm text-red-400">{error}</p>}

      {!loaded || !cursor ? (
        <p className="gsap-entrance mt-10 py-10 text-center text-sm text-neutral-600">Loading…</p>
      ) : (
        <>
          <div className="gsap-entrance mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
            {/* The month dial: one dot per day around a matte knob, lit where
                something's due, gold for today, with the needle on today. */}
            <div className="flex flex-col items-center rounded-3xl bg-gradient-to-b from-[#19191b] to-[#121213] px-6 pb-6 pt-8 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.9)]">
              <div className="relative h-56 w-56">
                {Array.from({ length: monthDays }, (_, d) => {
                  const angle = (d / monthDays) * Math.PI * 2 - Math.PI / 2;
                  const has = (byDay.get(dateKey(new Date(cursor.year, cursor.month, d + 1))) ?? []).some((r) => !r.done);
                  const isToday = d === todayIndex;
                  return (
                    <span
                      key={d}
                      className={`absolute h-1 w-1 rounded-full ${
                        isToday ? "bg-[var(--calendar-accent)] shadow-[0_0_6px_var(--calendar-accent)]" : has ? "bg-neutral-100" : "bg-neutral-700"
                      }`}
                      style={{ left: `${50 + Math.cos(angle) * 47}%`, top: `${50 + Math.sin(angle) * 47}%`, transform: "translate(-50%,-50%)" }}
                    />
                  );
                })}
                <div className="absolute inset-[14%] rounded-full bg-[radial-gradient(circle_at_50%_40%,#202022,#141415_75%)] shadow-[0_14px_30px_-8px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                  {todayIndex !== null && (
                    <span
                      className="absolute left-1/2 top-1/2 h-1/2 w-px origin-top"
                      style={{ transform: `rotate(${(todayIndex / monthDays) * 360 + 180}deg)` }}
                    >
                      <span className="absolute bottom-1.5 left-0 h-3 w-px bg-neutral-200" />
                    </span>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="stat-num !text-[46px]">{String(monthCount).padStart(2, "0")}</span>
                  </div>
                </div>
              </div>
              <p className="label mt-6 text-neutral-300">Upcoming</p>
              <p className="label mt-1.5">This month</p>
            </div>

            <div className="flex flex-col rounded-3xl bg-gradient-to-b from-[#19191b] to-[#121213] p-6 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between">
                <p className="label">Next up</p>
                <p className="label flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${upcoming.length ? "bg-accent" : "bg-neutral-700"}`} />
                  {upcoming.length} active
                </p>
              </div>
              <div className="mt-4 flex flex-1 flex-col">
                {nextUp.length === 0 ? (
                  <p className="my-auto text-sm font-normal text-neutral-600">Nothing coming up. Pick a day below to add one.</p>
                ) : (
                  nextUp.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelected(new Date(r.dueAt))}
                      className="flex items-center gap-4 border-b border-line py-3.5 text-left last:border-0"
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[r.priority] ?? PRIORITY_DOT.normal}`} />
                      <span className="min-w-0 flex-1 truncate text-[15px] font-normal text-neutral-200">{r.title}</span>
                      <span className="label shrink-0">
                        {new Date(r.dueAt).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => today && setSelected(today)}
                className="btn btn-primary mt-4 self-end"
              >
                New reminder
              </button>
            </div>
          </div>

          <div className="gsap-entrance mt-4 rounded-3xl bg-gradient-to-b from-[#19191b] to-[#121213] p-6 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.9)]">
            <div className="label grid grid-cols-7 gap-2 text-center">
              {WEEKDAYS.map((w) => (
                <div key={w}>
                  <span className="hidden sm:inline">{w.slice(0, 3)}</span>
                  <span className="sm:hidden">{w.slice(0, 1)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {grid.map((day, i) => {
                const inMonth = day.getMonth() === cursor.month;
                const isToday = today !== null && sameDay(day, today);
                const dots = byDay.get(dateKey(day)) ?? [];
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(day)}
                    className={`relative flex min-h-[54px] flex-col items-center justify-center gap-1.5 rounded-xl transition-colors sm:min-h-[68px] ${
                      inMonth ? "bg-[#1b1b1d] text-neutral-300 hover:bg-[#222225]" : "bg-transparent text-neutral-700 hover:bg-[#161618]"
                    }`}
                  >
                    <span className={`text-sm font-normal tabular-nums ${isToday ? "text-neutral-50" : ""}`}>{day.getDate()}</span>
                    {isToday && <span className="absolute bottom-2 h-px w-4 bg-[var(--calendar-accent)]" />}
                    {dots.length > 0 && (
                      <div className="flex items-center gap-0.5">
                        {dots.slice(0, MAX_DOTS_PER_DAY).map((r) => (
                          <span
                            key={r.id}
                            className={`h-1 w-1 rounded-full ${r.done ? "bg-neutral-700" : (PRIORITY_DOT[r.priority] ?? PRIORITY_DOT.normal)}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="label mt-5 flex items-center gap-5">
              <span className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[var(--calendar-accent)]" /> High</span>
              <span className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-neutral-300" /> Normal</span>
              <span className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-neutral-600" /> Low</span>
            </div>
          </div>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6" onClick={() => setSelected(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md animate-[rise-in_0.2s_ease-out_backwards] modal"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="label">
                  {selected.toLocaleDateString([], { weekday: "long" })}
                </p>
                <h2 className="mt-2 text-2xl font-normal text-neutral-100">
                  {selected.toLocaleDateString([], { day: "numeric", month: "long" })}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="label transition-colors hover:text-neutral-200"
              >
                Close
              </button>
            </div>

            <div className="mt-6 flex flex-col">
              {selectedReminders.length === 0 ? (
                <p className="py-3 text-sm font-normal text-neutral-600">Nothing scheduled.</p>
              ) : (
                selectedReminders.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 border-b border-line py-3.5 last:border-0">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[r.priority] ?? PRIORITY_DOT.normal}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[15px] font-normal ${r.done ? "text-neutral-600 line-through" : "text-neutral-100"}`}>{r.title}</p>
                      <p className="label mt-0.5">
                        {new Date(r.dueAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    <button onClick={() => toggleDone(r)} className="label hover:text-neutral-100">
                      {r.done ? "Undo" : "Done"}
                    </button>
                    <button onClick={() => remove(r.id)} className="label hover:text-red-400">
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8">
              <label htmlFor="remind-title" className="label">
                Remind me to
              </label>
              <input
                id="remind-title"
                ref={titleInputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOnSelectedDay()}
                className="mt-2 w-full input text-lg font-normal text-neutral-100 outline-none"
              />
              <div className="mt-5 flex items-center gap-3">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="rounded-xl bg-[#1f1f22] px-3 py-2 font-mono text-sm text-neutral-300 outline-none [color-scheme:dark]"
                />
                <PriorityPicker value={newPriority} onChange={setNewPriority} />
              </div>
            </div>

            <button
              onClick={addOnSelectedDay}
              disabled={!newTitle.trim()}
              className="btn btn-primary mt-8 w-full"
            >
              Add reminder
            </button>
          </div>
        </div>
      )}
    </GsapEntrance>
  );
}
