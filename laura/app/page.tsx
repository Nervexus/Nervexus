"use client";

import { useState } from "react";
import Link from "next/link";
import { AmbientField } from "@/components/AmbientField";
import { Pill } from "@/components/Pill";

export default function Home() {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-neutral-950">
      <AmbientField hovering={hovering} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 160px 30px rgba(0,0,0,0.7)" }}
        aria-hidden="true"
      />

      <div className="relative mt-auto px-6 pb-16 pt-24 text-center">
        <Pill className="mb-6">Personal Assistant</Pill>

        <h1 className="font-serif text-5xl text-neutral-50 sm:text-6xl md:text-7xl">
          Remember
          <br />
          <span className="italic font-light text-amber-300">everything.</span>
        </h1>

        <p className="mx-auto mt-8 max-w-[440px] text-balance font-mono text-sm text-neutral-500 sm:text-base">
          A voice that&apos;s always ready to listen — notes, reminders, and a vault that never
          forgets.
        </p>

        <Link href="/laura">
          <button
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className="mt-14 rounded-sm border border-amber-500/40 px-6 py-3 font-mono text-xs uppercase tracking-widest text-amber-300 transition-colors hover:border-amber-400 hover:bg-amber-500/10"
          >
            [ Talk to Laura ]
          </button>
        </Link>
      </div>
    </div>
  );
}
