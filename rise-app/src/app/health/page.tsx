"use client";

import { PageHeader } from "@/components/PageHeader";
import { DailyChecklist } from "@/components/DailyChecklist";
import { SliderStat } from "@/components/SliderStat";
import { getCategory } from "@/lib/categories";
import { useLocalStorage } from "@/lib/useLocalStorage";

interface HealthStats {
  water: number;
  sleep: number;
  steps: number;
}

export default function HealthPage() {
  const category = getCategory("health");
  const todayKey = new Date().toISOString().slice(0, 10);
  const [stats, setStats] = useLocalStorage<HealthStats>(
    `health-stats:${todayKey}`,
    { water: 0, sleep: 0, steps: 0 }
  );

  function set<K extends keyof HealthStats>(key: K, value: number) {
    setStats((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Health Improvements"
        title="Body & Recovery"
        subtitle={category.tagline}
        color="var(--cat-health-page)"
        back
      />

      <div className="mb-5 flex flex-col gap-3">
        <SliderStat
          label="Water"
          value={stats.water}
          max={8}
          unit=" glasses"
          color={category.color}
          onChange={(v) => set("water", v)}
        />
        <SliderStat
          label="Sleep"
          value={stats.sleep}
          max={10}
          unit="h"
          color={category.color}
          onChange={(v) => set("sleep", v)}
        />
        <SliderStat
          label="Steps"
          value={stats.steps}
          max={15}
          unit="k"
          color={category.color}
          onChange={(v) => set("steps", v)}
        />
      </div>

      <DailyChecklist
        storageKey={`category:${category.key}`}
        defaultItems={category.defaultItems}
        color={category.color}
      />
    </div>
  );
}
