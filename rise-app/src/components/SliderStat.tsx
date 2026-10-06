"use client";

import type { CSSProperties } from "react";
import { GlassCard } from "./GlassCard";

export function SliderStat({
  label,
  value,
  max,
  unit = "",
  color = "var(--accent)",
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  color?: string;
  onChange: (value: number) => void;
}) {
  const fill = max ? `${(value / max) * 100}%` : "0%";

  return (
    <GlassCard className="p-4">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm font-semibold">
          {value}
          <span className="text-muted">{unit} / {max}{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-slider"
        style={{ "--slider-color": color, "--slider-fill": fill } as CSSProperties}
      />
    </GlassCard>
  );
}
