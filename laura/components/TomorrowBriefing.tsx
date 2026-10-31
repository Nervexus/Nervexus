"use client";

import { useEffect, useState } from "react";
import { Group, Section } from "@/components/ui/layout";

type Briefing = {
  shift: { startAt: string; endAt: string; location: string | null } | null;
  reminders: { id: string }[];
  summary: string;
};

/** A folded "what's tomorrow look like" row on the Laura page -- the same
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

  const count = briefing.reminders.length;
  return (
    <Group className="gsap-entrance mt-8 w-full max-w-xl">
      <Section
        title="Tomorrow"
        icon="solar:calendar-linear"
        summary={[briefing.shift ? "Shift" : null, count ? `${count} reminder${count === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ")}
      >
        <p className="text-sm leading-relaxed text-neutral-600">{briefing.summary}</p>
      </Section>
    </Group>
  );
}
