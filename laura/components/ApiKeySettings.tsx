"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";

type Service = { id: string; label: string; detail: string; main: { maskedKey: string } | null };
type BackupKey = { id: string; service: string; label: string; maskedKey: string; active: boolean };

export function ApiKeySettings() {
  const [services, setServices] = useState<Service[]>([]);
  const [keys, setKeys] = useState<BackupKey[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/settings/api-keys")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setServices(data.services ?? []);
        setKeys(data.keys ?? []);
      })
      .catch(() => setError("Couldn't load API keys."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  return (
    <div className="card p-5">
      <span className="label">API keys</span>
      <p className="mt-1 text-xs text-neutral-500">
        Laura uses the main key first. If it hits its limit or stops working she moves down the list, so add as many
        backups as you like.
      </p>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      {!loaded && <p className="mt-4 text-xs text-neutral-400">Loading…</p>}

      <div className="mt-4 flex flex-col gap-3">
        {services.map((s) => (
          <ServiceKeys
            key={s.id}
            service={s}
            keys={keys.filter((k) => k.service === s.id)}
            onChange={load}
            onError={setError}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceKeys({
  service,
  keys,
  onChange,
  onError,
}: {
  service: Service;
  keys: BackupKey[];
  onChange: () => void;
  onError: (msg: string | null) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const total = keys.length + (service.main ? 1 : 0);

  async function add() {
    if (!apiKey.trim()) return;
    setSaving(true);
    onError(null);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: service.id, label: label.trim(), apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save.");
      setLabel("");
      setApiKey("");
      setAdding(false);
      onChange();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(k: BackupKey) {
    await fetch(`/api/settings/api-keys/${k.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !k.active }),
    });
    onChange();
  }

  async function remove(k: BackupKey) {
    if (!confirm(`Remove "${k.label}"?`)) return;
    await fetch(`/api/settings/api-keys/${k.id}`, { method: "DELETE" });
    onChange();
  }

  async function move(index: number, by: -1 | 1) {
    const ids = keys.map((k) => k.id);
    const target = index + by;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await fetch("/api/settings/api-keys", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: service.id, ids }),
    });
    onChange();
  }

  const offset = service.main ? 2 : 1;

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-neutral-800">{service.label}</h3>
          <p className="truncate text-[11px] text-neutral-500">{service.detail}</p>
        </div>
        <span className="pill shrink-0">
          {total} {total === 1 ? "key" : "keys"}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {service.main ? (
          <KeyRow position={1} label="Main key" sub={`${service.main.maskedKey} · set in Vercel`}>
            <span className="tag tag-purple">in use</span>
          </KeyRow>
        ) : (
          <p className="px-1 text-xs text-neutral-500">No main key in Vercel, so backups are used directly.</p>
        )}

        {keys.map((k, i) => (
          <KeyRow key={k.id} position={i + offset} label={k.label} sub={k.maskedKey} dimmed={!k.active}>
            <div className="flex items-center gap-0.5">
              <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)} icon="solar:alt-arrow-up-linear" />
              <IconButton
                label="Move down"
                disabled={i === keys.length - 1}
                onClick={() => move(i, 1)}
                icon="solar:alt-arrow-down-linear"
              />
            </div>
            <button
              onClick={() => toggle(k)}
              className={`tag transition-colors ${k.active ? "!border-green/20 !bg-green-soft !text-green" : ""}`}
            >
              {k.active ? "on" : "paused"}
            </button>
            <IconButton label={`Remove ${k.label}`} onClick={() => remove(k)} icon="solar:trash-bin-2-linear" danger />
          </KeyRow>
        ))}
      </div>

      {adding ? (
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`${service.label} API key`}
            type="password"
            autoComplete="off"
            className="input font-mono text-sm placeholder:font-sans"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`Name (optional), e.g. Backup ${keys.length + 1}`}
            className="input text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={add} disabled={!apiKey.trim() || saving}>
              {saving ? "Checking…" : "Save key"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-line-3 py-2.5 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-400 hover:bg-white/40 hover:text-neutral-800"
        >
          <iconify-icon icon="solar:add-circle-linear" className="text-sm" />
          Add backup key
        </button>
      )}
    </div>
  );
}

function KeyRow({
  position,
  label,
  sub,
  dimmed = false,
  children,
}: {
  position: number;
  label: string;
  sub: string;
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`item flex items-center gap-3 !rounded-[14px] px-3 py-2.5 ${dimmed ? "opacity-60" : ""}`}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 font-mono text-[11px] text-neutral-500">
        {position}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-800">{label}</p>
        <p className="truncate font-mono text-[11px] text-neutral-400">{sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </div>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  disabled = false,
  danger = false,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/60 disabled:opacity-30 disabled:hover:bg-transparent ${
        danger ? "hover:text-red-400" : "hover:text-neutral-800"
      }`}
    >
      <iconify-icon icon={icon} className="text-base" />
    </button>
  );
}
