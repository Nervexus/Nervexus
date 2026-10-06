"use client";

import { PageHeader } from "@/components/PageHeader";
import { DailyChecklist } from "@/components/DailyChecklist";
import { GlassCard } from "@/components/GlassCard";
import { getCategory } from "@/lib/categories";

const ROUTINE = [
  { step: "Cleanse", detail: "AM & PM" },
  { step: "Moisturize", detail: "SPF 30+ in AM" },
  { step: "Haircare", detail: "2–3x / week" },
  { step: "Posture & stretch", detail: "5 min daily" },
];

export default function LooksPage() {
  const category = getCategory("looks");

  return (
    <div>
      <PageHeader
        eyebrow="Looks Improvements"
        title="Grooming & Style"
        subtitle={category.tagline}
        color="var(--cat-looks-page)"
        back
      />

      <GlassCard strong className="animate-fade-up mb-5 overflow-hidden">
        <div className="px-5 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Core routine
          </p>
        </div>
        <div className="mt-3 flex flex-col">
          {ROUTINE.map((r) => (
            <div
              key={r.step}
              className="flex items-center justify-between border-t border-border px-5 py-3.5 first:border-t-0"
            >
              <span className="text-sm font-medium">{r.step}</span>
              <span className="text-sm text-muted">{r.detail}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <DailyChecklist
        storageKey={`category:${category.key}`}
        defaultItems={category.defaultItems}
        color={category.color}
      />
    </div>
  );
}
