"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { SettingsCard } from "@/components/SettingsCard";
import { Pill } from "@/components/Pill";
import { GsapEntrance } from "@/components/GsapEntrance";
import { FaceIdSettings } from "@/components/FaceIdSettings";
import { PasswordSettings } from "@/components/PasswordSettings";
import { MessageSettings } from "@/components/MessageSettings";
import { ClaudeRequests } from "@/components/ClaudeRequests";
import { ApiKeySettings } from "@/components/ApiKeySettings";
import { ApiProblemsCard } from "@/components/api-keys/ApiProblemsCard";
import { OPEN_KEYS_TAB } from "@/components/api-keys/shared";

type Status = "connected" | "expiring" | "missing";
type Item = {
  key: string;
  label: string;
  status: Status;
  detail: string | null;
};

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

const CREDENTIALS_GUIDE_URL =
  "https://claude.ai/artifact/AodDP54kAa3VXMB5K1kunt";

// The tab lives in the URL hash so "Open API keys" in the pop-up lands on it.
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener(OPEN_KEYS_TAB, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(OPEN_KEYS_TAB, onChange);
  };
}

function pickTab(next: "general" | "keys") {
  history.replaceState(history.state, "", next === "keys" ? "#api-keys" : window.location.pathname);
  window.dispatchEvent(new Event(OPEN_KEYS_TAB));
}

export default function SettingsPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  const tab = hash === "#api-keys" ? "keys" : "general";

  useEffect(() => {
    fetch("/api/settings/status")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setError("Couldn't load integration status."));
  }, []);

  const needsAttention =
    items?.filter((i) => i.status !== "connected").length ?? 0;

  return (
    <GsapEntrance className="relative mx-auto max-w-3xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance flex items-center gap-3">
        <h1 className="page-title">Settings</h1>
        {items && (
          <Pill>
            {needsAttention === 0 ? "all set" : `${needsAttention} need setup`}
          </Pill>
        )}
      </div>
      <p className="gsap-entrance mt-2 text-sm text-neutral-500">
        every credential Laura uses or will use, and whether it&apos;s connected
        — none of the actual secret values are ever shown here, only status
      </p>

      <div className="gsap-entrance mt-6 tabs w-fit">
        {(
          [
            ["general", "General"],
            ["keys", "API keys"],
          ] as const
        ).map(([id, name]) => (
          <button
            key={id}
            onClick={() => pickTab(id)}
            className={`tab ${tab === id ? "is-active" : ""}`}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === "keys" ? (
        <div className="mt-6 flex flex-col gap-4">
          <ApiProblemsCard />
          <ApiKeySettings />
        </div>
      ) : (
        <>
          <div className="gsap-entrance mt-6">
            <MessageSettings />
          </div>

          <div className="gsap-entrance mt-4">
            <ClaudeRequests />
          </div>

          <div className="gsap-entrance mt-4">
            <PasswordSettings />
          </div>

          <div className="gsap-entrance mt-4">
            <FaceIdSettings />
          </div>

          <a
            href={CREDENTIALS_GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="gsap-entrance mt-6 flex items-center gap-3 card p-5 transition-colors hover:border-neutral-300"
          >
            <iconify-icon
              icon="solar:document-text-linear"
              className="shrink-0 text-xl text-neutral-400"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-neutral-800">
                Full credentials setup guide
              </h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                step-by-step instructions for every item below
              </p>
            </div>
            <iconify-icon
              icon="solar:arrow-right-up-linear"
              className="shrink-0 text-base text-neutral-500"
            />
          </a>

          <div className="mt-8 flex flex-col gap-8">
            {error && (
              <p className="gsap-entrance text-sm text-red-400">{error}</p>
            )}
            {!items && !error && (
              <p className="gsap-entrance text-sm text-neutral-600">Loading…</p>
            )}
            {items &&
              GROUPS.map(({ label, keys }) => {
                const groupItems = items.filter((i) => keys.includes(i.key));
                if (groupItems.length === 0) return null;
                return (
                  <div key={label}>
                    <h2 className="label gsap-entrance mb-3">{label}</h2>
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
        </>
      )}
    </GsapEntrance>
  );
}
