"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import type { CategoryMeta } from "@/lib/categories";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { RoutineItem } from "@/lib/types";
import { ProgressRing } from "./ProgressRing";
import { GlassCard } from "./GlassCard";
import {
  FaceIcon,
  HeartPulseIcon,
  SparkleIcon,
  TrendUpIcon,
} from "./icons";

const ICONS = {
  "self-improvement": SparkleIcon,
  health: HeartPulseIcon,
  "social-media": TrendUpIcon,
  looks: FaceIcon,
};

export function categoryStorageKey(key: string) {
  const todayKey = new Date().toISOString().slice(0, 10);
  return `category:${key}:${todayKey}`;
}

export function CategoryCard({ category }: { category: CategoryMeta }) {
  const [items] = useLocalStorage<RoutineItem[]>(
    categoryStorageKey(category.key),
    category.defaultItems.map((text) => ({ id: text, text, done: false }))
  );
  const Icon = ICONS[category.key];

  const progress = useMemo(() => {
    if (!items.length) return 0;
    return items.filter((i) => i.done).length / items.length;
  }, [items]);

  return (
    <Link href={category.href}>
      <GlassCard className="group relative h-full overflow-hidden p-4 transition-transform duration-200 active:scale-[0.98]">
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.12] blur-xl"
          style={{ background: category.color }}
        />
        <div className="flex items-start justify-between">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: `color-mix(in srgb, ${category.color} 18%, transparent)` }}
          >
            <Icon className="h-4.5 w-4.5" style={{ color: category.color } as CSSProperties} />
          </div>
          <ProgressRing value={progress} size={34} stroke={3.5} color={category.color}>
            <span className="text-[9px] font-semibold">
              {Math.round(progress * 100)}
            </span>
          </ProgressRing>
        </div>
        <p className="mt-3 text-sm font-semibold leading-tight">
          {category.label}
        </p>
        <p className="mt-0.5 text-xs text-muted">{category.tagline}</p>
      </GlassCard>
    </Link>
  );
}
