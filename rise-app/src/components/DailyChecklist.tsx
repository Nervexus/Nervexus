"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "./GlassCard";
import { ProgressRing } from "./ProgressRing";
import { PlusIcon, TrashIcon } from "./icons";
import { uid, useLocalStorage } from "@/lib/useLocalStorage";
import { useXp } from "@/lib/useXp";
import { XP_REWARDS } from "@/lib/xp";
import type { RoutineItem } from "@/lib/types";

export function DailyChecklist({
  storageKey,
  defaultItems,
  color,
  title = "Today",
}: {
  storageKey: string;
  defaultItems: string[];
  color: string;
  title?: string;
}) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const [items, setItems] = useLocalStorage<RoutineItem[]>(
    `${storageKey}:${todayKey}`,
    defaultItems.map((text) => ({ id: uid(), text, done: false }))
  );
  const [draft, setDraft] = useState("");
  const [, addXp] = useXp();

  const done = useMemo(() => items.filter((i) => i.done).length, [items]);
  const progress = items.length ? done / items.length : 0;

  function toggle(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    addXp(item.done ? -XP_REWARDS.habitToggle : XP_REWARDS.habitToggle);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
    );
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function add() {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => [...prev, { id: uid(), text, done: false }]);
    setDraft("");
  }

  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="text-lg font-semibold">
            {done}
            <span className="text-muted">/{items.length} done</span>
          </p>
        </div>
        <ProgressRing value={progress} size={56} stroke={5} color={color}>
          <span className="text-xs font-semibold">
            {Math.round(progress * 100)}%
          </span>
        </ProgressRing>
      </div>

      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-foreground/[0.04]"
          >
            <button
              onClick={() => toggle(item.id)}
              aria-label={item.done ? "Mark as not done" : "Mark as done"}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all"
              style={{
                borderColor: item.done ? color : "var(--border-strong)",
                background: item.done ? color : "transparent",
              }}
            >
              {item.done && (
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5L19 7" />
                </svg>
              )}
            </button>
            <span
              className={`flex-1 text-sm transition-colors ${
                item.done ? "text-muted line-through" : "text-foreground"
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => remove(item.id)}
              aria-label="Remove item"
              className="opacity-0 transition-opacity group-hover:opacity-100 text-muted hover:text-negative"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">
            Nothing here yet — add your first item.
          </p>
        )}
      </ul>

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add an item..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/70 focus:outline-none"
        />
        <button
          onClick={add}
          aria-label="Add item"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full glass-pill hover:bg-foreground/15"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
    </GlassCard>
  );
}
