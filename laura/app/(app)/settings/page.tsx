"use client";

import { useEffect, useState } from "react";
import { SettingsCard } from "@/components/SettingsCard";
import { Pill } from "@/components/Pill";
import { GsapEntrance } from "@/components/GsapEntrance";
import { FaceIdSettings } from "@/components/FaceIdSettings";

type Status = "connected" | "expiring" | "missing";
type Item = { key: string; label: string; status: Status; detail: string | null };

const ICON: Record<string, string> = {
  gemini: "solar:cpu-bolt-linear",
  turso: "solar:database-linear",
  encryptionKey: "solar:lock-keyhole-linear",
  telegram: "solar:chat-round-linear",
  cronSecret: "solar:clock-circle-linear",
  instagram: "solar:camera-linear",
  maps: "solar:map-point-linear",
  calendar: "solar:calendar-linear",
};

const GROUPS: { label: string; keys: string[] }[] = [
  { label: "Core", keys: ["gemini", "turso", "encryptionKey"] },
  { label: "Messaging & automation", keys: ["telegram", "cronSecret"] },
  { label: "Future phases", keys: ["instagram", "maps", "calendar"] },
];

const CREDENTIALS_GUIDE_URL = "https://claude.ai/artifact/AodDP54kAa3VXMB5K1kunt";

export default function SettingsPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/status")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setError("Couldn't load integration status."));
  }, []);

  const needsAttention = items?.filter((i) => i.status !== "connected").length ?? 0;

  return (
    <GsapEntrance className="relative mx-auto max-w-3xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance flex items-center gap-3">
        <h1 className="page-title">Settings</h1>
        {items && <Pill>{needsAttention === 0 ? "all set" : `${needsAttention} need setup`}</Pill>}
      </div>
      <p className="gsap-entrance mt-2 text-sm text-neutral-500">
        every credential Laura uses or will use, and whether it&apos;s connected — none of the
        actual secret values are ever shown here, only status
      </p>

      <div className="gsap-entrance mt-8">
        <FaceIdSettings />
      </div>

      <a
        href={CREDENTIALS_GUIDE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="gsap-entrance mt-6 flex items-center gap-3 card p-5 transition-colors hover:border-neutral-600"
      >
        <iconify-icon icon="solar:document-text-linear" className="shrink-0 text-xl text-neutral-400" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-neutral-100">Full credentials setup guide</h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            step-by-step instructions for every item below
          </p>
        </div>
        <iconify-icon icon="solar:arrow-right-up-linear" className="shrink-0 text-base text-neutral-500" />
      </a>

      <div className="mt-8 flex flex-col gap-8">
        {error && <p className="gsap-entrance text-sm text-red-400">{error}</p>}
        {!items && !error && <p className="gsap-entrance text-sm text-neutral-600">Loading…</p>}
        {items &&
          GROUPS.map(({ label, keys }) => {
            const groupItems = items.filter((i) => keys.includes(i.key));
            if (groupItems.length === 0) return null;
            return (
              <div key={label}>
                <h2 className="label gsap-entrance mb-3">
                  {label}
                </h2>
                <div className="flex flex-col gap-2">
                  {groupItems.map((item) => (
                    <div key={item.key} className="gsap-entrance">
                      <SettingsCard
                        icon={ICON[item.key] ?? "solar:settings-linear"}
                        label={item.label}
                        detail={item.detail}
                        status={item.status}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </GsapEntrance>
  );
}
