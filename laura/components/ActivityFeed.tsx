"use client";

import { useEffect, useState, type ReactNode } from "react";
import { NoteIcon, ClockIcon } from "@/components/icons";

type Entry = { id: string; tool: string; summary: string; createdAt: string };

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

function MessageIcon({ className }: { className?: string }) {
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

function BusIcon({ className }: { className?: string }) {
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
      <rect x="4" y="4" width="16" height="13" rx="2" />
      <path d="M4 12h16" />
      <path d="M8 20v-3M16 20v-3" />
      <circle cx="8" cy="15" r="0.6" fill="currentColor" />
      <circle cx="16" cy="15" r="0.6" fill="currentColor" />
    </svg>
  );
}

const TOOL_ICON: Record<string, (className: string) => ReactNode> = {
  create_note: (c) => <NoteIcon className={c} />,
  create_reminder: (c) => <ClockIcon className={c} />,
  web_search: (c) => <SearchIcon className={c} />,
  call_me: (c) => <PhoneIcon className={c} />,
  start_video_call: (c) => <PhoneIcon className={c} />,
  text_me: (c) => <MessageIcon className={c} />,
  plan_commute: (c) => <BusIcon className={c} />,
  search_booking_options: (c) => <BookmarkIcon className={c} />,
  create_booking: (c) => <BookmarkIcon className={c} />,
  prepare_booking: (c) => <BookmarkIcon className={c} />,
  research_instagram_account: (c) => <GalleryIcon className={c} />,
  create_content_idea: (c) => <GalleryIcon className={c} />,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ refreshKey }: { refreshKey?: number }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/activity")
      .then((res) => res.json())
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setError("Couldn't load activity."));
  }, [refreshKey]);

  if (error) return <p className="px-6 py-6 text-sm text-red-400">{error}</p>;
  if (!entries) return <p className="px-6 py-6 text-sm text-neutral-600">Loading…</p>;
  if (entries.length === 0) {
    return (
      <p className="px-6 py-6 text-sm text-neutral-600">
        Nothing yet — once Laura saves a note, sets a reminder, or searches the web, it&apos;ll
        show up here.
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2 px-6 py-6">
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
          className="flex animate-[rise-in_0.4s_ease-out_backwards] items-center gap-3 item px-3.5 py-2.5 backdrop-blur-sm"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
            {TOOL_ICON[entry.tool]?.("h-4 w-4") ?? <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-neutral-200">{entry.summary}</p>
          </div>
          <span className="shrink-0 text-[11px] text-neutral-600">{timeAgo(entry.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}
