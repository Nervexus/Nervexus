"use client";

import { useMemo } from "react";
import { CATEGORIES } from "@/lib/categories";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { RoutineItem } from "@/lib/types";
import { categoryStorageKey } from "./CategoryCard";
import { ProgressRing } from "./ProgressRing";

function useCategoryItems(key: string, defaults: string[]) {
  return useLocalStorage<RoutineItem[]>(
    categoryStorageKey(key),
    defaults.map((text) => ({ id: text, text, done: false }))
  );
}

export function TodayOverview() {
  const [a] = useCategoryItems(CATEGORIES[0].key, CATEGORIES[0].defaultItems);
  const [b] = useCategoryItems(CATEGORIES[1].key, CATEGORIES[1].defaultItems);
  const [c] = useCategoryItems(CATEGORIES[2].key, CATEGORIES[2].defaultItems);
  const [d] = useCategoryItems(CATEGORIES[3].key, CATEGORIES[3].defaultItems);

  const { done, total, progress } = useMemo(() => {
    const all = [...a, ...b, ...c, ...d];
    const done = all.filter((i) => i.done).length;
    const total = all.length;
    return { done, total, progress: total ? done / total : 0 };
  }, [a, b, c, d]);

  const label =
    progress === 0
      ? "Let's get moving"
      : progress < 0.4
      ? "Just getting started"
      : progress < 0.8
      ? "Solid momentum"
      : progress < 1
      ? "Almost there"
      : "Fully maxed today";

  return (
    <div className="animate-fade-up grid grid-cols-5 gap-3">
      <div className="col-span-3 rounded-3xl bg-accent p-5 text-accent-ink">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink/60">
          Today&apos;s Progress
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-tight">
          {done}
          <span className="text-lg text-accent-ink/55">/{total}</span>
        </p>
        <p className="mt-1 text-sm text-accent-ink/70">{label}</p>
      </div>
      <div className="col-span-2 flex flex-col items-center justify-center rounded-3xl glass p-4 text-center">
        <ProgressRing value={progress} size={60} stroke={6} color="var(--accent)">
          <span className="text-sm font-semibold">
            {Math.round(progress * 100)}%
          </span>
        </ProgressRing>
        <p className="mt-2 text-xs text-muted">{total - done} left</p>
      </div>
    </div>
  );
}
