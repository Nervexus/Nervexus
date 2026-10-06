"use client";

import Link from "next/link";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useXp } from "@/lib/useXp";
import { levelFromXp, rankForLevel } from "@/lib/xp";
import { PersonIcon } from "./icons";

export function RankBadge() {
  const [avatar] = useLocalStorage<string | null>("profile:avatar", null);
  const [xp] = useXp();
  const { level } = levelFromXp(xp);
  const rank = rankForLevel(level);

  return (
    <Link
      href="/profile"
      className="flex shrink-0 items-center gap-2 rounded-full glass-pill py-1.5 pl-1.5 pr-3 transition-transform active:scale-95"
    >
      <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-accent text-accent-ink">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <PersonIcon className="h-4 w-4" />
        )}
      </span>
      <span className="text-xs font-semibold">
        {rank}
        <span className="font-normal text-muted"> · Lv {level}</span>
      </span>
    </Link>
  );
}
