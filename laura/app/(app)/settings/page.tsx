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
import { Empty, Group, PageHeader, Row, Section } from "@/components/ui/layout";

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

const CONNECTED = ["gemini", "turso", "encryptionKey", "telegram", "cronSecret"];
const FUTURE = ["instagram", "maps", "calendar"];

const CREDENTIALS_GUIDE_URL = "https://claude.ai/artifact/AodDP54kAa3VXMB5K1kunt";

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

  const needsAttention = items?.filter((i) => i.status !== "connected").length ?? 0;

  const byKey = (keys: string[]) => (items ?? []).filter((i) => keys.includes(i.key));
  const row = (item: Item) => (
    <SettingsCard
      key={item.key}
      icon={ICON[item.key] ?? "solar:settings-linear"}
      label={item.label}
      detail={item.detail}
      status={item.status}
    />
  );
  const future = byKey(FUTURE);

  return (
    <GsapEntrance className="relative mx-auto max-w-3xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance">
        <PageHeader
          title="Settings"
          meta={items && <Pill>{needsAttention === 0 ? "all set" : `${needsAttention} need setup`}</Pill>}
          sub="Texting, sign-in and keys"
        />
      </div>

      <div className="gsap-entrance tabs w-fit">
        {(
          [
            ["general", "General"],
            ["keys", "API keys"],
          ] as const
        ).map(([id, name]) => (
          <button key={id} onClick={() => pickTab(id)} className={`tab ${tab === id ? "is-active" : ""}`}>
            {name}
          </button>
        ))}
      </div>

      {tab === "keys" ? (
        <div className="mt-6">
          <ApiKeySettings problems={<ApiProblemsCard />} />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <Group className="gsap-entrance">
            <MessageSettings />
            <PasswordSettings />
            <FaceIdSettings />
            <ClaudeRequests />
          </Group>

          <Group title="Connections" className="gsap-entrance">
            {error && <Empty>{error}</Empty>}
            {!items && !error && <Empty>Loading…</Empty>}
            {items && byKey(CONNECTED).map(row)}
            {future.length > 0 && (
              <Section title="Coming later" icon="solar:hourglass-line-linear" summary={`${future.length}`}>
                {future.map(row)}
              </Section>
            )}
            <Row
              href={CREDENTIALS_GUIDE_URL}
              icon={<iconify-icon icon="solar:document-text-linear" />}
              title="Credentials setup guide"
              sub="Step-by-step for every item above"
              trailing={<iconify-icon icon="solar:arrow-right-up-linear" className="text-base text-dim" />}
            />
          </Group>
        </div>
      )}
    </GsapEntrance>
  );
}
