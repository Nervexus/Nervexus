"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GlassCard } from "./GlassCard";
import { ChevronRightIcon, CheckSquareIcon, TargetIcon } from "./icons";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { Checklist, Goal } from "@/lib/types";

function ToolArrow() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-ink">
      <ChevronRightIcon className="h-4 w-4" strokeWidth={2.2} />
    </span>
  );
}

export function ChecklistsSummary() {
  const [checklists] = useLocalStorage<Checklist[]>("checklists", []);

  const { done, total } = useMemo(() => {
    const allItems = checklists.flatMap((c) => c.items);
    return {
      done: allItems.filter((i) => i.done).length,
      total: allItems.length,
    };
  }, [checklists]);

  return (
    <Link href="/checklists" className="block h-full">
      <GlassCard className="flex h-full flex-col justify-between gap-5 p-4 transition-transform active:scale-[0.98]">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: "var(--surface-strong)" }}
        >
          <CheckSquareIcon className="h-4.5 w-4.5" style={{ color: "var(--cat-checklists)" }} />
        </div>
        <div>
          <p className="text-sm font-semibold">Checklists</p>
          <p className="mt-0.5 text-xs text-muted">
            {checklists.length ? `${done}/${total} items done` : "Create your first list"}
          </p>
        </div>
        <ToolArrow />
      </GlassCard>
    </Link>
  );
}

export function GoalsSummary() {
  const [goals] = useLocalStorage<Goal[]>("goals", []);

  const active = useMemo(
    () => goals.filter((g) => g.current < g.target).length,
    [goals]
  );

  return (
    <Link href="/goals" className="block h-full">
      <GlassCard className="flex h-full flex-col justify-between gap-5 p-4 transition-transform active:scale-[0.98]">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: "var(--surface-strong)" }}
        >
          <TargetIcon className="h-4.5 w-4.5" style={{ color: "var(--cat-goals)" }} />
        </div>
        <div>
          <p className="text-sm font-semibold">Goals</p>
          <p className="mt-0.5 text-xs text-muted">
            {goals.length ? `${active} active goal${active === 1 ? "" : "s"}` : "Set your first goal"}
          </p>
        </div>
        <ToolArrow />
      </GlassCard>
    </Link>
  );
}
