"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/GlassCard";
import { TrashIcon } from "@/components/icons";

export default function SettingsPage() {
  const [confirming, setConfirming] = useState(false);

  function resetAll() {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith("ascent:"))
      .forEach((k) => window.localStorage.removeItem(k));
    window.location.href = "/";
  }

  return (
    <div>
      <PageHeader eyebrow="Settings" title="Settings" back />

      <GlassCard className="mb-4 p-5">
        <p className="text-sm font-semibold">About Ascent</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Everything you track — checklists, goals, and daily habits across
          self improvement, health, social media and looks — is stored only
          on this device. There are no accounts and nothing is sent to a
          server.
        </p>
      </GlassCard>

      <GlassCard className="p-5">
        <p className="mb-1.5 text-sm font-semibold">Reset all data</p>
        <p className="mb-4 text-sm text-muted">
          Permanently clears every checklist, goal, and habit you&apos;ve
          logged on this device.
        </p>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 rounded-2xl bg-negative/15 px-4 py-2.5 text-sm font-medium text-negative transition-colors hover:bg-negative/25"
          >
            <TrashIcon className="h-4 w-4" />
            Reset everything
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={resetAll}
              className="flex-1 rounded-2xl bg-negative py-2.5 text-sm font-semibold text-black"
            >
              Confirm reset
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-2xl bg-white/5 py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
