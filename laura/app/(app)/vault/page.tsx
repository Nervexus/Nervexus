"use client";

import { useEffect, useState } from "react";
import { Chip } from "@/components/SidebarCard";
import { VaultCard } from "@/components/VaultCard";
import { Pill } from "@/components/Pill";
import { GsapEntrance } from "@/components/GsapEntrance";
import { Empty, Group, PageHeader, Section } from "@/components/ui/layout";

type VaultItem = { id: string; title: string; updatedAt: string };

const QUICK_START = ["Wifi password", "Door code", "Bank PIN", "Safe combination", "Recovery codes"];

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/vault")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setError("Couldn't load the vault."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  async function add() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !secret) return;
    setError(null);

    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save this.");
      setTitle("");
      setSecret("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this.");
    }
  }

  async function fetchSecret(id: string): Promise<string | null> {
    setRevealing(id);
    try {
      const res = await fetch(`/api/vault/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't decrypt this.");
      return data.secret as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't decrypt this.");
      return null;
    } finally {
      setRevealing(null);
    }
  }

  async function reveal(id: string) {
    if (revealed[id] !== undefined) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    const secret = await fetchSecret(id);
    if (secret !== null) setRevealed((prev) => ({ ...prev, [id]: secret }));
  }

  async function copy(id: string) {
    const value = revealed[id] ?? (await fetchSecret(id));
    if (value === null || value === undefined) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/vault/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <GsapEntrance className="relative mx-auto max-w-3xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance">
        <PageHeader title="Vault" meta={<Pill>{items.length} items</Pill>} sub="Encrypted at rest. Only this page can read them, not Laura." />
      </div>

      {error && <p className="gsap-entrance mb-4 text-sm text-red-400">{error}</p>}

      <div className="gsap-entrance">
        <Group>
          {!loaded ? (
            <Empty>Loading…</Empty>
          ) : items.length === 0 ? (
            <Empty>The vault is empty. Add a password or code below.</Empty>
          ) : (
            items.map((item) => (
              <VaultCard
                key={item.id}
                title={item.title}
                revealedValue={revealed[item.id]}
                revealing={revealing === item.id}
                copied={copiedId === item.id}
                onReveal={() => reveal(item.id)}
                onCopy={() => copy(item.id)}
                onDelete={() => remove(item.id)}
              />
            ))
          )}
        </Group>
      </div>

      <div className="gsap-entrance mt-6">
        <Group>
          <Section title="Add to vault" icon="solar:add-circle-linear">
            <div className="flex flex-col gap-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is this? (e.g. Wi-Fi password)" className="input text-sm" />
              <input
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Secret value"
                type="password"
                className="input font-mono text-sm placeholder:font-sans"
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_START.map((suggestion) => (
                  <Chip key={suggestion} onClick={() => setTitle(suggestion)}>
                    {suggestion}
                  </Chip>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={add} disabled={!title.trim() || !secret} className="btn btn-primary">
                  Add to vault
                </button>
              </div>
            </div>
          </Section>
          <Section title="How this works" icon="solar:shield-keyhole-linear" summary="AES-256-GCM">
            <p className="text-[13px] leading-relaxed text-muted">
              Secrets are encrypted (AES-256-GCM) before they ever touch the database. Laura&apos;s brain has no tool to
              read the Vault. Only this page can decrypt an item, one at a time, when you press Reveal or Copy.
            </p>
          </Section>
        </Group>
      </div>
    </GsapEntrance>
  );
}
