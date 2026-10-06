"use client";

import { PageHeader } from "@/components/PageHeader";
import { DailyChecklist } from "@/components/DailyChecklist";
import { GlassCard } from "@/components/GlassCard";
import { getCategory } from "@/lib/categories";
import { useLocalStorage } from "@/lib/useLocalStorage";

const PROMPTS = [
  "What's one thing you're proud of today?",
  "What drained your energy today, and why?",
  "What's the smallest next step toward your biggest goal?",
  "Who did you help or connect with today?",
  "What would make tomorrow 1% better?",
];

export default function SelfImprovementPage() {
  const category = getCategory("self-improvement");
  const todayKey = new Date().toISOString().slice(0, 10);
  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];
  const [journal, setJournal] = useLocalStorage<string>(
    `journal:${todayKey}`,
    ""
  );

  return (
    <div>
      <PageHeader
        eyebrow="Self Improvement"
        title="Mindset & Growth"
        subtitle={category.tagline}
        color={category.color}
        back
      />

      <div className="mb-5">
        <DailyChecklist
          storageKey={`category:${category.key}`}
          defaultItems={category.defaultItems}
          color={category.color}
        />
      </div>

      <GlassCard className="animate-fade-up p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          Daily reflection
        </p>
        <p className="mb-3 text-sm text-foreground/90">{prompt}</p>
        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          placeholder="Write a few lines..."
          rows={4}
          className="w-full resize-none rounded-2xl bg-foreground/5 p-4 text-sm leading-relaxed placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-foreground/20"
        />
      </GlassCard>
    </div>
  );
}
