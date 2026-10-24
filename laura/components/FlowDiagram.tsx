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

function CalendarIcon({ className }: { className?: string }) {
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
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9.5h16M8 3v3.5M16 3v3.5" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
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
      <path d="M6 4h12v16l-6-4-6 4V4Z" />
    </svg>
  );
}

function GalleryIcon({ className }: { className?: string }) {
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
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m5 17 4.5-4.5 3 3L18 10l1.5 1.5" />
    </svg>
  );
}

const STAGE_W = 920;
const NODE_COUNT = 8;
// Evenly-spaced virtual centers in a 0..STAGE_W space -- the actual node
// row below uses the same even distribution (flex-1 each), so these line
// up with the real rendered centers regardless of viewport width.
const nodeCenterX = (i: number) => ((i + 0.5) / NODE_COUNT) * STAGE_W;

type Reminder = { title: string; dueAt: string; done: boolean };

// Maps a tool name (as returned from /api/chat's toolsUsed) to the node it
// should briefly light up.
const TOOL_NODE: Record<string, string> = {
  create_note: "Notes",
  create_reminder: "Reminders",
  web_search: "Web search",
  call_me: "Calls & texts",
  text_me: "Calls & texts",
  get_shifts: "Rota",
  who_am_i_working_with: "Rota",
  plan_commute: "Rota",
  search_booking_options: "Bookings",
  create_booking: "Bookings",
  research_instagram_account: "Content",
  create_content_idea: "Content",
};

export const FlowDiagram = forwardRef<
  VoiceOrbHandle,
  { onTranscript: (text: string) => void; pulseTools?: string[]; pulseKey?: number }
>(function FlowDiagram({ onTranscript, pulseTools, pulseKey }, orbRef) {
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [vaultCount, setVaultCount] = useState<number | null>(null);
  const [nextReminder, setNextReminder] = useState<Reminder | null>(null);
  const [reminderCount, setReminderCount] = useState<number | null>(null);
  const [callCount, setCallCount] = useState<number | null>(null);
  const [rotaCount, setRotaCount] = useState<number | null>(null);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [contentCount, setContentCount] = useState<number | null>(null);
  const [pulsingNodes, setPulsingNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!pulseKey || !pulseTools || pulseTools.length === 0) return;
    const nodeTitles = new Set(
      pulseTools.map((t) => TOOL_NODE[t]).filter(Boolean) as string[]
    );
    if (nodeTitles.size === 0) return;
    setPulsingNodes(nodeTitles);
    const timer = setTimeout(() => setPulsingNodes(new Set()), 1800);
    return () => clearTimeout(timer);
    // Deliberately keyed only on pulseKey: pulseTools is captured from the
    // same render that bumped pulseKey, so it's always in sync; including
    // it in the deps array would also re-fire on unrelated parent renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulseKey]);

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

    fetch("/api/calls")
      .then((res) => res.json())
      .then((data) => setCallCount(data.logs?.length ?? 0))
      .catch(() => setCallCount(0));

    fetch("/api/rota")
      .then((res) => res.json())
      .then((data) => {
        const upcoming = (data.shifts ?? []).filter(
          (s: { endAt: string }) => new Date(s.endAt) >= new Date()
        );
        setRotaCount(upcoming.length);
      })
      .catch(() => setRotaCount(0));

    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        const active = (data.bookings ?? []).filter(
          (b: { status: string }) => b.status !== "cancelled"
        );
        setBookingCount(active.length);
      })
      .catch(() => setBookingCount(0));

    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        const active = (data.ideas ?? []).filter(
          (i: { status: string }) => i.status !== "discarded"
        );
        setContentCount(active.length);
      })
      .catch(() => setContentCount(0));
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
      subtitle: callCount === null ? "…" : callCount > 0 ? `${callCount} sent` : "via Telegram",
      href: "/calls",
      active: true,
    },
    {
      icon: <CalendarIcon className="h-4 w-4" />,
      title: "Rota",
      subtitle: rotaCount === null ? "…" : rotaCount > 0 ? `${rotaCount} upcoming` : "upload a photo",
      href: "/rota",
      active: true,
    },
    {
      icon: <BookmarkIcon className="h-4 w-4" />,
      title: "Bookings",
      subtitle: bookingCount === null ? "…" : bookingCount > 0 ? `${bookingCount} tracked` : "search one",
      href: "/bookings",
      active: true,
    },
    {
      icon: <GalleryIcon className="h-4 w-4" />,
      title: "Content",
      subtitle: contentCount === null ? "…" : contentCount > 0 ? `${contentCount} tracked` : "brainstorm one",
      href: "/content",
      active: true,
    },
  ];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-neutral-300">
        <ChatBubbleIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
        You
      </div>

      <div className="h-6 w-px bg-neutral-700 sm:h-8" />

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
          {nodes.map((node, i) => (
            <path
              key={i}
              d={`M ${STAGE_W / 2} 0 C ${STAGE_W / 2} 20, ${nodeCenterX(i)} 20, ${nodeCenterX(i)} 40`}
              stroke={
                pulsingNodes.has(node.title) ? "rgba(245,245,245,0.9)" : "rgba(115,115,115,0.3)"
              }
              strokeWidth={pulsingNodes.has(node.title) ? 2 : 1.5}
              strokeDasharray="5 7"
              className="animate-[flow-dash_1.1s_linear_infinite] transition-[stroke,stroke-width] duration-300"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      <div className="h-6 w-px bg-neutral-700 sm:hidden" />

      <div
        className="mx-auto grid w-full grid-cols-2 gap-2 sm:flex sm:gap-3.5"
        style={{ maxWidth: STAGE_W }}
      >
        {nodes.map((node, i) => (
          <div key={node.title} className="sm:min-w-0 sm:flex-1">
            <FlowNode
              {...node}
              pulsing={pulsingNodes.has(node.title)}
              style={{ animationDelay: `${i * 70}ms` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
