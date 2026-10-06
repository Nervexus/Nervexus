"use client";

import { useMemo } from "react";
import { CATEGORIES } from "@/lib/categories";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { RoutineItem } from "@/lib/types";
import { categoryStorageKey } from "./CategoryCard";
import { ProgressRing } from "./ProgressRing";
import { GlassCard, Pill } from "./GlassCard";

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
    <GlassCard strong className="animate-fade-up relative overflow-hidden p-6">
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--cat-self)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--cat-health)" }}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Today&apos;s Progress
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">
            {done}
            <span className="text-xl text-muted">/{total}</span>
          </p>
          <p className="mt-1 text-sm text-muted">{label}</p>
        </div>
        <ProgressRing value={progress} size={84} stroke={7} color="#ffffff">
          <span className="text-lg font-semibold">
            {Math.round(progress * 100)}%
          </span>
        </ProgressRing>
      </div>
      <div className="relative mt-5 flex flex-wrap gap-2">
        <Pill>{total - done} remaining</Pill>
        <Pill>4 categories</Pill>
      </div>
    </GlassCard>
  );
}
