"use client";

import { useEffect, useState } from "react";
import { HudCard, HexBadge } from "@/components/HudCard";
import { ClockIcon, CheckIcon } from "@/components/icons";

type Reminder = {
  id: string;
  title: string;
  note: string | null;
  dueAt: string;
  done: boolean;
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex-1">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="font-semibold tracking-tight">Reminders</h1>
        <p className="text-xs text-neutral-500">
          things to do, set by you or by Laura from a conversation
        </p>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-6">
        <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
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

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {loaded && reminders.length === 0 && (
          <p className="text-sm text-neutral-600">No reminders yet.</p>
        )}

        <div className="flex flex-col gap-3">
          {upcoming.map((reminder) => (
            <HudCard key={reminder.id}>
              <div className="flex items-start gap-3">
                <HexBadge>
                  <ClockIcon className="h-4 w-4" />
                </HexBadge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium">{reminder.title}</h3>
                    <div className="flex shrink-0 gap-3 text-xs text-neutral-500">
                      <button onClick={() => toggleDone(reminder)} className="hover:text-neutral-200">
                        Done
                      </button>
                      <button onClick={() => remove(reminder.id)} className="hover:text-red-400">
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs tracking-wide text-neutral-500">
                    {new Date(reminder.dueAt).toLocaleString()}
                  </p>
                  {reminder.note && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-400">{reminder.note}</p>
                  )}
                </div>
              </div>
            </HudCard>
          ))}
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
                      <button onClick={() => toggleDone(reminder)} className="hover:text-neutral-200">
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
      </div>
    </div>
  );
}
