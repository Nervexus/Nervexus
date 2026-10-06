"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DailyChecklist } from "@/components/DailyChecklist";
import { GlassCard, Pill } from "@/components/GlassCard";
import { ProgressRing } from "@/components/ProgressRing";
import { getCategory } from "@/lib/categories";
import { useLocalStorage } from "@/lib/useLocalStorage";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", initial: "IG", color: "#f472b6" },
  { key: "tiktok", label: "TikTok", initial: "TT", color: "#f1f5f9" },
  { key: "youtube", label: "YouTube", initial: "YT", color: "#f87171" },
  { key: "x", label: "X", initial: "X", color: "#94a3b8" },
];

type Followers = Record<string, number>;

export default function SocialMediaPage() {
  const category = getCategory("social-media");
  const [followers, setFollowers] = useLocalStorage<Followers>(
    "social-followers",
    { instagram: 0, tiktok: 0, youtube: 0, x: 0 }
  );

  const total = useMemo(
    () => Object.values(followers).reduce((a, b) => a + b, 0),
    [followers]
  );

  function setPlatform(key: string, value: number) {
    setFollowers((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <PageHeader
            eyebrow="Social Media Improvement"
            title="Reach & Influence"
            subtitle={category.tagline}
            color="var(--cat-social-page)"
            back
          />
        </div>
        <Pill className="mt-10 shrink-0">This week</Pill>
      </div>

      <GlassCard strong className="animate-fade-up mb-5 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Total reach
        </p>
        <p className="mt-2 text-4xl font-semibold tracking-tight">
          {total.toLocaleString()}
        </p>
        <p className="mt-1 text-sm text-muted">across {PLATFORMS.length} platforms</p>
      </GlassCard>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {PLATFORMS.map((platform) => {
          const value = followers[platform.key] ?? 0;
          const share = total ? value / total : 0;
          return (
            <GlassCard key={platform.key} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-black"
                  style={{ background: platform.color }}
                >
                  {platform.initial}
                </div>
                <ProgressRing value={share} size={28} stroke={3} color={platform.color} />
              </div>
              <p className="text-xs text-muted">{platform.label}</p>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={value}
                onChange={(e) => setPlatform(platform.key, Number(e.target.value) || 0)}
                className="mt-1 w-full bg-transparent text-xl font-semibold tabular-nums focus:outline-none"
              />
            </GlassCard>
          );
        })}
      </div>

      <DailyChecklist
        storageKey={`category:${category.key}`}
        defaultItems={category.defaultItems}
        color={category.color}
      />
    </div>
  );
}
