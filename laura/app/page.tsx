"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DotGrid } from "@/components/DotGrid";
import { NoteIcon, ClockIcon, LockIcon, SearchIcon, PlayIcon } from "@/components/icons";

type Counts = { notes: number | null; reminders: number | null; vault: number | null };

const FEATURES = [
  { n: "01", label: "Notes", icon: NoteIcon },
  { n: "02", label: "Reminders", icon: ClockIcon },
  { n: "03", label: "Vault", icon: LockIcon },
  { n: "04", label: "Search", icon: SearchIcon },
];

export default function Home() {
  const [counts, setCounts] = useState<Counts>({ notes: null, reminders: null, vault: null });

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => setCounts((c) => ({ ...c, notes: data.notes?.length ?? 0 })))
      .catch(() => setCounts((c) => ({ ...c, notes: 0 })));

    fetch("/api/reminders")
      .then((res) => res.json())
      .then((data) =>
        setCounts((c) => ({
          ...c,
          reminders: data.reminders?.filter((r: { done: boolean }) => !r.done).length ?? 0,
        }))
      )
      .catch(() => setCounts((c) => ({ ...c, reminders: 0 })));

    fetch("/api/vault")
      .then((res) => res.json())
      .then((data) => setCounts((c) => ({ ...c, vault: data.items?.length ?? 0 })))
      .catch(() => setCounts((c) => ({ ...c, vault: 0 })));
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden bg-neutral-950">
      <DotGrid />
      <div
        className="pointer-events-none absolute right-[-10%] top-[-10%] h-[60%] w-[55%] rounded-full opacity-60 blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.16), transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 180px 40px rgba(0,0,0,0.75)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 sm:px-10 sm:py-8">
        {/* Top micro-bar */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Laura<span className="text-amber-500">.</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            online
          </span>
        </div>

        {/* Hero */}
        <div className="flex flex-1 flex-col justify-center gap-10 py-16 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold uppercase leading-[0.95] tracking-tight text-neutral-50 sm:text-7xl">
              Endless
              <br />
              <span className="text-amber-400">Memory</span>
            </h1>

            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link href="/laura" className="group flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-700 text-neutral-200 transition-colors group-hover:border-amber-400 group-hover:text-amber-300">
                  <PlayIcon className="ml-0.5 h-4 w-4" />
                </span>
                <span className="text-xs font-medium uppercase tracking-widest text-neutral-300 group-hover:text-amber-300">
                  Talk to Laura
                </span>
              </Link>

              <Link
                href="/laura"
                className="rounded-sm bg-amber-500 px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-neutral-950 transition-colors hover:bg-amber-400"
              >
                Get started
              </Link>
            </div>
          </div>

          <div className="max-w-xs rounded-lg border border-neutral-800 bg-neutral-950/70 p-5 backdrop-blur-sm lg:mt-24">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Laura</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              A personal assistant that remembers everything you tell her — notes, reminders, an
              encrypted vault, and a voice that&apos;s always ready to listen.
            </p>
          </div>
        </div>

        {/* Bottom row: stats + quick links */}
        <div className="flex flex-col gap-6 border-t border-neutral-800 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-3 text-xs text-neutral-500">
            <Link href="/notes" className="hover:text-amber-300">
              Notes
            </Link>
            <Link href="/reminders" className="hover:text-amber-300">
              Reminders
            </Link>
            <Link href="/vault" className="hover:text-amber-300">
              Vault
            </Link>
          </div>

          <div className="flex gap-10">
            <div>
              <div className="text-3xl font-bold text-neutral-100">{counts.notes ?? "–"}</div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-600">Notes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-neutral-100">{counts.reminders ?? "–"}</div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-600">Reminders</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-neutral-100">{counts.vault ?? "–"}</div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-600">Vault items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical feature index, right edge */}
      <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-5 lg:flex">
        {FEATURES.map((f) => (
          <div key={f.n} className="flex flex-col items-center gap-1 text-neutral-700">
            <span className="font-mono text-[10px] tracking-widest">{f.n}</span>
            <f.icon className="h-3.5 w-3.5" />
          </div>
        ))}
        <span className="mt-1 h-10 w-px bg-neutral-800" />
      </div>
    </div>
  );
}
