"use client";

import { useEffect, useState } from "react";

type Briefing = {
  shift: { startAt: string; endAt: string; location: string | null } | null;
  reminders: { id: string }[];
  summary: string;
};

/** A compact "what's tomorrow look like" card on the Laura page -- the same
 * answer get_tomorrow_briefing gives in conversation, surfaced without
 * having to ask. Renders nothing while loading or on failure (the chat
 * tool is the fallback either way), so a Turso outage never shows an
 * error banner above the actual assistant. */
export function TomorrowBriefing() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);

  useEffect(() => {
    fetch("/api/briefing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBriefing(data?.briefing ?? null))
      .catch(() => setBriefing(null));
  }, []);

  if (!briefing || (!briefing.shift && briefing.reminders.length === 0)) return null;

  return (
    <div className="gsap-entrance gradient-border relative mt-6 w-full max-w-xl item px-4 py-3 backdrop-blur-sm">
      <span className="label">
        Tomorrow
      </span>
      <p className="mt-1 text-sm leading-relaxed text-neutral-600">{briefing.summary}</p>
    </div>
  );
}
