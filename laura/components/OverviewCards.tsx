"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HudCard, HexBadge } from "@/components/HudCard";
import { NoteIcon, ClockIcon, LockIcon } from "@/components/icons";

type Reminder = { title: string; dueAt: string; done: boolean };

export function OverviewCards() {
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [vaultCount, setVaultCount] = useState<number | null>(null);
  const [nextReminder, setNextReminder] = useState<Reminder | null | undefined>(undefined);
  const [reminderCount, setReminderCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => setNoteCount(data.notes?.length ?? 0))
      .catch(() => setNoteCount(0));

    fetch("/api/vault")
      .then((res) => res.json())
      .then((data) => setVaultCount(data.items?.length ?? 0))
      .catch(() => setVaultCount(0));

    fetch("/api/reminders")
      .then((res) => res.json())
      .then((data) => {
        const upcoming: Reminder[] = (data.reminders ?? []).filter((r: Reminder) => !r.done);
        setReminderCount(upcoming.length);
        setNextReminder(upcoming[0] ?? null);
      })
      .catch(() => {
        setReminderCount(0);
        setNextReminder(null);
      });
  }, []);

  return (
    <div className="grid w-full grid-cols-3 gap-3">
      <Link href="/notes">
        <HudCard className="h-full">
          <div className="flex flex-col items-center gap-2 text-center">
            <HexBadge>
              <NoteIcon className="h-4 w-4" />
            </HexBadge>
            <span className="text-lg font-serif text-neutral-100">
              {noteCount ?? "–"}
            </span>
            <span className="text-[11px] tracking-wide text-neutral-500">notes</span>
          </div>
        </HudCard>
      </Link>

      <Link href="/reminders">
        <HudCard className="h-full">
          <div className="flex flex-col items-center gap-2 text-center">
            <HexBadge>
              <ClockIcon className="h-4 w-4" />
            </HexBadge>
            <span className="text-lg font-serif text-neutral-100">
              {reminderCount ?? "–"}
            </span>
            <span className="truncate text-[11px] tracking-wide text-neutral-500">
              {nextReminder ? nextReminder.title : "reminders"}
            </span>
          </div>
        </HudCard>
      </Link>

      <Link href="/vault">
        <HudCard className="h-full">
          <div className="flex flex-col items-center gap-2 text-center">
            <HexBadge>
              <LockIcon className="h-4 w-4" />
            </HexBadge>
            <span className="text-lg font-serif text-neutral-100">
              {vaultCount ?? "–"}
            </span>
            <span className="text-[11px] tracking-wide text-neutral-500">vault</span>
          </div>
        </HudCard>
      </Link>
    </div>
  );
}
