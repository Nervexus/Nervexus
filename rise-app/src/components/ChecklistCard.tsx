"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "./GlassCard";
import { ProgressRing } from "./ProgressRing";
import { PlusIcon, TrashIcon } from "./icons";
import { uid } from "@/lib/useLocalStorage";
import type { Checklist } from "@/lib/types";

export function ChecklistCard({
  checklist,
  onChange,
  onDelete,
}: {
  checklist: Checklist;
  onChange: (next: Checklist) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState("");

  const { done, total, progress } = useMemo(() => {
    const done = checklist.items.filter((i) => i.done).length;
    const total = checklist.items.length;
    return { done, total, progress: total ? done / total : 0 };
  }, [checklist.items]);

  function toggle(id: string) {
    onChange({
      ...checklist,
      items: checklist.items.map((i) =>
        i.id === id ? { ...i, done: !i.done } : i
      ),
    });
  }

  function removeItem(id: string) {
    onChange({ ...checklist, items: checklist.items.filter((i) => i.id !== id) });
  }

  function addItem() {
    const text = draft.trim();
    if (!text) return;
    onChange({
      ...checklist,
      items: [...checklist.items, { id: uid(), text, done: false }],
    });
    setDraft("");
  }

  return (
    <GlassCard className="animate-fade-up p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{checklist.title}</p>
          <p className="text-xs text-muted">
            {total ? `${done}/${total} complete` : "Empty checklist"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProgressRing value={progress} size={38} stroke={4} color="var(--cat-checklists)">
            <span className="text-[10px] font-semibold">
              {Math.round(progress * 100)}
            </span>
          </ProgressRing>
          <button
            onClick={onDelete}
            aria-label="Delete checklist"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-foreground/10 hover:text-negative"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {checklist.items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-foreground/[0.04]"
          >
            <button
              onClick={() => toggle(item.id)}
              aria-label={item.done ? "Mark as not done" : "Mark as done"}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all"
              style={{
                borderColor: item.done ? "#fff" : "var(--border-strong)",
                background: item.done ? "#fff" : "transparent",
              }}
            >
              {item.done && (
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5L19 7" />
                </svg>
              )}
            </button>
            <span
              className={`flex-1 text-sm ${
                item.done ? "text-muted line-through" : "text-foreground"
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              aria-label="Remove item"
              className="opacity-0 transition-opacity group-hover:opacity-100 text-muted hover:text-negative"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center gap-2 border-t border-border pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add item..."
          className="flex-1 bg-transparent text-sm placeholder:text-muted/70 focus:outline-none"
        />
        <button
          onClick={addItem}
          aria-label="Add item"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full glass-pill hover:bg-foreground/15"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
    </GlassCard>
  );
}
