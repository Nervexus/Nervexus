"use client";

import Link from "next/link";
import { AvatarPicker } from "@/components/AvatarPicker";
import { GlassCard } from "@/components/GlassCard";
import { PageHeader } from "@/components/PageHeader";
import { ProgressRing } from "@/components/ProgressRing";
import { ChevronRightIcon, GearIcon } from "@/components/icons";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useXp } from "@/lib/useXp";
import { levelFromXp, rankForLevel } from "@/lib/xp";

export default function ProfilePage() {
  const [name, setName] = useLocalStorage<string>("profile:name", "");
  const [avatar, setAvatar] = useLocalStorage<string | null>(
    "profile:avatar",
    null
  );
  const [xp] = useXp();

  const { level, xpIntoLevel, xpForNextLevel } = levelFromXp(xp);
  const rank = rankForLevel(level);
  const progress = xpForNextLevel ? xpIntoLevel / xpForNextLevel : 0;

  return (
    <div>
      <PageHeader eyebrow="Your account" title="Profile" back />

      <GlassCard
        strong
        className="animate-fade-up mb-5 flex flex-col items-center gap-3 p-6 text-center"
      >
        <AvatarPicker value={avatar} onChange={setAvatar} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full bg-transparent text-center text-lg font-semibold placeholder:text-muted/60 focus:outline-none"
        />
      </GlassCard>

      <GlassCard className="animate-fade-up mb-5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Power Level
            </p>
            <p className="mt-1 text-2xl font-semibold">{rank}</p>
            <p className="mt-0.5 text-sm text-muted">Level {level}</p>
          </div>
          <ProgressRing value={progress} size={72} stroke={6} color="var(--accent)">
            <span className="text-sm font-semibold">{level}</span>
          </ProgressRing>
        </div>

        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-muted">XP to next level</span>
          <span className="font-semibold tabular-nums">
            {xpIntoLevel}
            <span className="text-muted"> / {xpForNextLevel}</span>
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          Total XP earned: {xp.toLocaleString()}
        </p>
      </GlassCard>

      <GlassCard className="animate-fade-up mb-5 p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          How XP works
        </p>
        <ul className="flex flex-col gap-1.5 text-sm text-foreground/85">
          <li>+10 XP — complete a daily category habit</li>
          <li>+5 XP — check off a checklist item</li>
          <li>+5 XP — each step toward a goal</li>
          <li>+100 XP — complete a goal</li>
        </ul>
      </GlassCard>

      <Link href="/settings">
        <GlassCard className="flex items-center justify-between p-4 transition-transform active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: "var(--surface-strong)" }}
            >
              <GearIcon className="h-4.5 w-4.5" />
            </div>
            <p className="text-sm font-semibold">Settings</p>
          </div>
          <ChevronRightIcon className="h-4 w-4 text-muted" />
        </GlassCard>
      </Link>
    </div>
  );
}
