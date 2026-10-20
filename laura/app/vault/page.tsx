"use client";

import { useEffect, useState } from "react";
import { HudCard, HexBadge } from "@/components/HudCard";
import { LockIcon } from "@/components/icons";

type VaultItem = { id: string; title: string; updatedAt: string };

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);
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

  async function reveal(id: string) {
    if (revealed[id] !== undefined) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    setRevealing(id);
    try {
      const res = await fetch(`/api/vault/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't decrypt this.");
      setRevealed((prev) => ({ ...prev, [id]: data.secret }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't decrypt this.");
    } finally {
      setRevealing(null);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/vault/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="flex-1">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="font-semibold tracking-tight">Vault</h1>
        <p className="text-xs text-neutral-500">
          encrypted at rest — Laura herself can&apos;t read these, only this page can
        </p>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-6">
        <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What is this? (e.g. Wi-Fi password)"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-neutral-600"
          />
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Secret value"
            type="password"
            className="mt-2 w-full bg-transparent font-mono text-sm text-neutral-300 outline-none placeholder:font-sans placeholder:text-neutral-600"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={add}
              disabled={!title.trim() || !secret}
              className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 disabled:opacity-40"
            >
              Add to vault
            </button>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {loaded && items.length === 0 && (
          <p className="text-sm text-neutral-600">The vault is empty.</p>
        )}

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <HudCard key={item.id}>
              <div className="flex items-center gap-3">
                <HexBadge>
                  <LockIcon className="h-4 w-4" />
                </HexBadge>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <p className="mt-1 truncate font-mono text-sm text-neutral-400">
                    {revealed[item.id] ?? "••••••••••••"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3 text-xs text-neutral-500">
                  <button
                    onClick={() => reveal(item.id)}
                    disabled={revealing === item.id}
                    className="hover:text-neutral-200 disabled:opacity-50"
                  >
                    {revealing === item.id ? "…" : revealed[item.id] !== undefined ? "Hide" : "Reveal"}
                  </button>
                  <button onClick={() => remove(item.id)} className="hover:text-red-400">
                    Delete
                  </button>
                </div>
              </div>
            </HudCard>
          ))}
        </div>
      </div>
    </div>
  );
}
