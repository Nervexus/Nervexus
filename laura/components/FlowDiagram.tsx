"use client";

import { forwardRef, useEffect, useState } from "react";
import { VoiceOrb, type VoiceOrbHandle } from "@/components/VoiceOrb";
import { FlowNode } from "@/components/FlowNode";
import { NoteIcon, ClockIcon, LockIcon } from "@/components/icons";

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 5h16v11H9l-5 4V5Z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

const STAGE_W = 680;
const NODE_COUNT = 5;
// Evenly-spaced virtual centers in a 0..STAGE_W space -- the actual node
// row below uses the same even distribution (flex-1 each), so these line
// up with the real rendered centers regardless of viewport width.
const nodeCenterX = (i: number) => ((i + 0.5) / NODE_COUNT) * STAGE_W;

type Reminder = { title: string; dueAt: string; done: boolean };

export const FlowDiagram = forwardRef<
  VoiceOrbHandle,
  { onTranscript: (text: string) => void }
>(function FlowDiagram({ onTranscript }, orbRef) {
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [vaultCount, setVaultCount] = useState<number | null>(null);
  const [nextReminder, setNextReminder] = useState<Reminder | null>(null);
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

  const nodes = [
    {
      icon: <NoteIcon className="h-4 w-4" />,
      title: "Notes",
      subtitle: noteCount === null ? "…" : `${noteCount} saved`,
      href: "/notes",
      active: true,
    },
    {
      icon: <ClockIcon className="h-4 w-4" />,
      title: "Reminders",
      subtitle: nextReminder ? nextReminder.title : reminderCount === null ? "…" : "up to date",
      href: "/reminders",
      active: true,
    },
    {
      icon: <LockIcon className="h-4 w-4" />,
      title: "Vault",
      subtitle: vaultCount === null ? "…" : `${vaultCount} items`,
      href: "/vault",
      active: true,
    },
    {
      icon: <SearchIcon className="h-4 w-4" />,
      title: "Web search",
      subtitle: "live, via Gemini",
      active: true,
    },
    {
      icon: <PhoneIcon className="h-4 w-4" />,
      title: "Calls & texts",
      subtitle: "not wired up yet",
      active: false,
    },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs text-neutral-300">
        <ChatBubbleIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
        You
      </div>

      <div className="h-6 w-px bg-emerald-500/30 sm:h-8" />

      <VoiceOrb ref={orbRef} onTranscript={onTranscript} />

      {/* Fan-out connectors, desktop/tablet only -- a mobile-width diagram
          this precise doesn't reflow cleanly, so phones get a plain grid. */}
      <div className="relative hidden h-10 w-full sm:block" style={{ maxWidth: STAGE_W }}>
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${STAGE_W} 40`}
          preserveAspectRatio="none"
          fill="none"
        >
          {nodes.map((_, i) => (
            <path
              key={i}
              d={`M ${STAGE_W / 2} 0 C ${STAGE_W / 2} 20, ${nodeCenterX(i)} 20, ${nodeCenterX(i)} 40`}
              stroke="rgba(52,211,153,0.3)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      <div className="h-6 w-px bg-emerald-500/30 sm:hidden" />

      <div
        className="mx-auto grid w-full grid-cols-2 gap-2 sm:flex sm:gap-3.5"
        style={{ maxWidth: STAGE_W }}
      >
        {nodes.map((node) => (
          <div key={node.title} className="sm:flex-1">
            <FlowNode {...node} />
          </div>
        ))}
      </div>
    </div>
  );
});
