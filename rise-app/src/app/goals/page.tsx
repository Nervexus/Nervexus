"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/GlassCard";
import { ProgressRing } from "@/components/ProgressRing";
import { PlusIcon, TrashIcon, XIcon } from "@/components/icons";
import { uid, useLocalStorage } from "@/lib/useLocalStorage";
import { CATEGORIES } from "@/lib/categories";
import type { Goal } from "@/lib/types";

const CATEGORY_OPTIONS = [
  { key: "general", label: "General", color: "var(--cat-checklists)" },
  ...CATEGORIES.map((c) => ({ key: c.key, label: c.short, color: c.color })),
];

function categoryColor(key: string) {
  return CATEGORY_OPTIONS.find((c) => c.key === key)?.color ?? "var(--accent)";
}

export default function GoalsPage() {
  const [goals, setGoals] = useLocalStorage<Goal[]>("goals", []);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [target, setTarget] = useState("10");
  const [unit, setUnit] = useState("");
  const [deadline, setDeadline] = useState("");

  function resetForm() {
    setTitle("");
    setCategory("general");
    setTarget("10");
    setUnit("");
    setDeadline("");
  }

  function createGoal() {
    const t = title.trim();
    const tgt = Number(target);
    if (!t || !Number.isFinite(tgt) || tgt <= 0) return;
    const next: Goal = {
      id: uid(),
      title: t,
      category: category as Goal["category"],
      target: tgt,
      current: 0,
      unit: unit.trim() || undefined,
      deadline: deadline || undefined,
      createdAt: Date.now(),
    };
    setGoals((prev) => [next, ...prev]);
    resetForm();
    setFormOpen(false);
  }

  function bump(id: string, delta: number) {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, current: Math.max(0, Math.min(g.target, g.current + delta)) }
          : g
      )
    );
  }

  function remove(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  const sorted = [...goals].sort((a, b) => {
    const aDone = a.current >= a.target;
    const bDone = b.current >= b.target;
    if (aDone !== bDone) return aDone ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Aim high"
        title="Goals"
        subtitle="Set a target and track it to the end."
        back
      />

      {!formOpen ? (
        <button
          onClick={() => setFormOpen(true)}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-3xl glass-strong py-3.5 text-sm font-medium transition-transform active:scale-[0.98]"
        >
          <PlusIcon className="h-4 w-4" />
          New goal
        </button>
      ) : (
        <GlassCard strong className="animate-fade-up mb-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">New goal</p>
            <button
              onClick={() => {
                setFormOpen(false);
                resetForm();
              }}
              aria-label="Close"
              className="text-muted hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Run a half marathon"
            className="mb-3 w-full rounded-2xl bg-foreground/5 px-4 py-3 text-sm placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />

          <div className="mb-3 flex flex-wrap gap-1.5">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background:
                    category === c.key
                      ? c.color
                      : "rgba(255,255,255,0.06)",
                  color: category === c.key ? "var(--accent-ink)" : "var(--foreground)",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="Target (e.g. 21)"
              className="rounded-2xl bg-foreground/5 px-4 py-3 text-sm placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit (km, days...)"
              className="rounded-2xl bg-foreground/5 px-4 py-3 text-sm placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>

          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mb-4 w-full rounded-2xl bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-foreground/20 [color-scheme:dark]"
          />

          <button
            onClick={createGoal}
            className="w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-accent-ink transition-transform active:scale-[0.98]"
          >
            Create goal
          </button>
        </GlassCard>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map((goal) => {
          const progress = goal.target ? goal.current / goal.target : 0;
          const color = categoryColor(goal.category);
          const complete = goal.current >= goal.target;
          return (
            <GlassCard key={goal.id} className="animate-fade-up p-4">
              <div className="flex items-center gap-4">
                <ProgressRing value={progress} size={52} stroke={5} color={color}>
                  <span className="text-xs font-semibold">
                    {Math.round(progress * 100)}%
                  </span>
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${complete ? "text-muted line-through" : ""}`}>
                    {goal.title}
                  </p>
                  <p className="text-xs text-muted">
                    {goal.current}
                    {goal.unit ? ` ${goal.unit}` : ""} of {goal.target}
                    {goal.unit ? ` ${goal.unit}` : ""}
                    {goal.deadline ? ` · due ${goal.deadline}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => remove(goal.id)}
                  aria-label="Delete goal"
                  className="text-muted hover:text-negative"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => bump(goal.id, -1)}
                  className="flex-1 rounded-xl bg-foreground/5 py-2 text-sm font-medium hover:bg-foreground/10"
                >
                  −
                </button>
                <button
                  onClick={() => bump(goal.id, 1)}
                  className="flex-1 rounded-xl bg-foreground/5 py-2 text-sm font-medium hover:bg-foreground/10"
                >
                  +
                </button>
              </div>
            </GlassCard>
          );
        })}
        {sorted.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            No goals yet. Set your first target above.
          </p>
        )}
      </div>
    </div>
  );
}
