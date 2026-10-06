"use client";

import Link from "next/link";
import { useMemo } from "react";
import { GlassCard } from "./GlassCard";
import { CheckSquareIcon, ChevronRightIcon, TargetIcon } from "./icons";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { Checklist, Goal } from "@/lib/types";

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
    <Link href="/checklists">
      <GlassCard className="flex items-center justify-between p-4 transition-transform active:scale-[0.98]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <CheckSquareIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Checklists</p>
            <p className="text-xs text-muted">
              {checklists.length
                ? `${done}/${total} items done`
                : "Create your first list"}
            </p>
          </div>
        </div>
        <ChevronRightIcon className="h-4 w-4 text-muted" />
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
    <Link href="/goals">
      <GlassCard className="flex items-center justify-between p-4 transition-transform active:scale-[0.98]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <TargetIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Goals</p>
            <p className="text-xs text-muted">
              {goals.length ? `${active} active goal${active === 1 ? "" : "s"}` : "Set your first goal"}
            </p>
          </div>
        </div>
        <ChevronRightIcon className="h-4 w-4 text-muted" />
      </GlassCard>
    </Link>
  );
}
