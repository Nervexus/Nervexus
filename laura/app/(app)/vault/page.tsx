"use client";

import { useEffect, useState } from "react";
import { LockIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { SidebarCard, Chip, Stat } from "@/components/SidebarCard";
import { VaultCard } from "@/components/VaultCard";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";

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
    <GsapEntrance className="relative mx-auto max-w-5xl px-6 pb-20">
      <div className="gsap-entrance flex items-center gap-3">
        <h1 className="font-thin text-3xl tracking-tight text-neutral-100">Vault</h1>
        <Pill>{items.length} items</Pill>
      </div>
      <p className="gsap-entrance mt-2 text-sm text-neutral-500">
        encrypted at rest — Laura herself can&apos;t read these, only this page can
      </p>

      <div className="gsap-entrance relative mt-8 rounded-[28px] border border-neutral-900 bg-neutral-950 p-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What is this? (e.g. Wi-Fi password)"
          className="w-full bg-transparent text-base font-light outline-none placeholder:text-neutral-600"
        />
        <input
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Secret value"
          type="password"
          className="mt-2.5 w-full bg-transparent font-mono text-sm text-neutral-300 outline-none placeholder:font-sans placeholder:text-neutral-600"
        />
        <div className="mt-3 flex justify-end">
          <Button variant="accent" onClick={add} disabled={!title.trim() || !secret}>
            Add to vault
          </Button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          {error && <p className="gsap-entrance mb-4 text-sm text-red-400">{error}</p>}

          {loaded && items.length === 0 ? (
            <EmptyState
              icon={<LockIcon className="h-5 w-5" />}
              title="The vault is empty"
              description="Save a password or code above — only this page can ever decrypt it."
            >
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {QUICK_START.map((suggestion) => (
                  <Chip key={suggestion} onClick={() => setTitle(suggestion)}>
                    {suggestion}
                  </Chip>
                ))}
              </div>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              {items.map((item) => (
                <div key={item.id} className="gsap-entrance">
                  <VaultCard
                    title={item.title}
                    revealedValue={revealed[item.id]}
                    revealing={revealing === item.id}
                    copied={copiedId === item.id}
                    onReveal={() => reveal(item.id)}
                    onCopy={() => copy(item.id)}
                    onDelete={() => remove(item.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="gsap-entrance flex flex-col gap-4">
          <SidebarCard title="Quick start">
            <div className="flex flex-wrap gap-2">
              {QUICK_START.map((suggestion) => (
                <Chip key={suggestion} onClick={() => setTitle(suggestion)}>
                  {suggestion}
                </Chip>
              ))}
            </div>
          </SidebarCard>

          <SidebarCard title="Stats">
            <Stat label="Items stored" value={items.length} />
          </SidebarCard>

          <SidebarCard title="How this works">
            <p className="text-xs leading-relaxed text-neutral-500">
              Secrets are encrypted (AES-256-GCM) before they ever touch the database. Laura&apos;s
              brain has no tool to read the Vault — only this page can decrypt an item, one at a
              time, when you click Reveal or Copy.
            </p>
          </SidebarCard>
        </aside>
      </div>
    </GsapEntrance>
  );
}
