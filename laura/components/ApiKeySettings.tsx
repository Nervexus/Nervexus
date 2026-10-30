"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";

type ApiKeyEntry = {
  id: string;
  service: string;
  label: string;
  maskedKey: string;
  priority: number;
  active: boolean;
  createdAt: string;
};

const SERVICES = [
  { value: "gemini", label: "Gemini" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "other", label: "Other" },
] as const;

export function ApiKeySettings() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [service, setService] = useState("gemini");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [priority, setPriority] = useState(0);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/settings/api-keys")
      .then((res) => res.json())
      .then((data) => setKeys(data.keys ?? []))
      .catch(() => setError("Couldn't load API keys."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  async function add() {
    if (!label.trim() || !apiKey.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, label: label.trim(), apiKey: apiKey.trim(), priority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save.");
      setLabel("");
      setApiKey("");
      setPriority(0);
      setAdding(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    await fetch(`/api/settings/api-keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/settings/api-keys/${id}`, { method: "DELETE" });
    load();
  }

  const envKey = process.env.NEXT_PUBLIC_HAS_GEMINI_KEY;
  const hasEnvKey = typeof window !== "undefined";

  const grouped = SERVICES.map((s) => ({
    ...s,
    keys: keys.filter((k) => k.service === s.value),
  })).filter((g) => g.keys.length > 0);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="label">API Keys</span>
        <Button variant="ghost" onClick={() => setAdding(!adding)}>
          {adding ? "Cancel" : "+ Add key"}
        </Button>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        add multiple keys per service for automatic fallback
      </p>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      {adding && (
        <div className="mt-4 flex flex-col gap-2.5 rounded-2xl border border-line bg-surface-2 p-4">
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="input text-sm text-neutral-700 outline-none [color-scheme:light]"
          >
            {SERVICES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label, e.g. Gemini Key 1"
            className="input text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
          />
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API key"
            type="password"
            className="input font-mono text-sm text-neutral-700 outline-none placeholder:font-sans placeholder:text-neutral-400"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-neutral-500">Priority (lower = tried first)</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              className="input w-20 text-center text-sm text-neutral-700 outline-none"
            />
          </div>
          <div className="flex justify-end">
            <Button variant="accent" onClick={add} disabled={!label.trim() || !apiKey.trim() || saving}>
              {saving ? "Saving…" : "Save key"}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {loaded && keys.length === 0 && !adding && (
          <p className="text-xs text-neutral-400">
            No custom API keys yet. Using environment defaults.
          </p>
        )}

        {grouped.map((group) => (
          <div key={group.value}>
            <h3 className="mb-1.5 text-xs font-medium text-neutral-500">{group.label}</h3>
            <div className="flex flex-col gap-1.5">
              {group.keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 border border-line"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-800">{k.label}</span>
                      <span className="font-mono text-[11px] text-neutral-400">{k.maskedKey}</span>
                    </div>
                    <span className="text-[11px] text-neutral-400">priority {k.priority}</span>
                  </div>
                  <button
                    onClick={() => toggle(k.id, !k.active)}
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                      k.active
                        ? "bg-green-soft text-green"
                        : "bg-neutral-100 text-neutral-400"
                    }`}
                  >
                    {k.active ? "active" : "off"}
                  </button>
                  <button
                    onClick={() => remove(k.id)}
                    className="shrink-0 text-neutral-300 transition-colors hover:text-red-400"
                  >
                    <iconify-icon icon="solar:trash-bin-2-linear" className="text-base" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
