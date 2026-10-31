"use client";

import { useEffect, useState } from "react";
import { KEYS_CHANGED, ago, inTime, toast } from "@/components/api-keys/shared";

type Key = {
  id: string;
  label: string;
  masked: string;
  status: "ok" | "limited" | "exhausted" | "invalid";
  until: string | null;
  error: string | null;
  info: Record<string, unknown>;
  lastUsed: string | null;
  uses: number;
  fromEnv: boolean;
};
type Service = {
  id: string;
  label: string;
  what: string;
  limits: string;
  how: readonly string[];
  activeId: string | null;
  nextReset: string | null;
  keys: Key[];
};

const GREEN = "!border-green/20 !bg-green-soft !text-green";

function keyPill(k: Key, active: boolean): { text: string; tone: string } {
  const wait = inTime(k.until);
  if (k.status === "invalid") return { text: "Rejected", tone: "tag-red" };
  if (k.status === "exhausted") return { text: wait ? `Used up, resets in ${wait}` : "Used up", tone: "tag-amber" };
  if (k.status === "limited") return { text: wait ? `Rate-limited, back in ${wait}` : "Rate-limited", tone: "tag-amber" };
  return active ? { text: "In use", tone: GREEN } : { text: "Working", tone: "" };
}

export function ApiKeySettings() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/keys")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setServices(data.services ?? []);
        setError(null);
      })
      .catch(() => setError("Couldn't load API keys."));
  }

  useEffect(() => {
    load();
    window.addEventListener(KEYS_CHANGED, load);
    return () => window.removeEventListener(KEYS_CHANGED, load);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!services && !error && <p className="text-xs text-neutral-400">Loading…</p>}
      {services?.map((s) => <ServiceCard key={s.id} service={s} onState={setServices} />)}
    </div>
  );
}

function ServiceCard({ service, onState }: { service: Service; onState: (s: Service[]) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");

  const header =
    service.keys.length === 0
      ? { text: "Not set up", tone: "" }
      : !service.activeId
        ? { text: "Down", tone: "tag-red" }
        : service.keys.some((k) => k.status !== "ok")
          ? { text: "Using a backup", tone: "tag-amber" }
          : { text: "Working", tone: GREEN };

  async function act(id: string, path: string, init: RequestInit, done?: (r: { ok: boolean; message: string }) => void) {
    setBusy(id);
    try {
      const res = await fetch(path, init);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      if (data.services) onState(data.services);
      if (data.result) done?.(data.result);
      window.dispatchEvent(new Event(KEYS_CHANGED));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong.", true);
    } finally {
      setBusy(null);
    }
  }

  function add() {
    if (!apiKey.trim()) return toast("Paste a key first.", true);
    act(
      "add",
      "/api/keys",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: service.id, key: apiKey.trim(), label: label.trim() }),
      },
      (r) => {
        toast(r.ok ? `Key added and working.` : `Key added but not working: ${r.message}`, !r.ok);
        if (r.ok) {
          setApiKey("");
          setLabel("");
        }
      }
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-neutral-800">{service.label}</h3>
        <span className={`tag shrink-0 ${header.tone}`}>{header.text}</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">
        {service.what} {service.limits}
      </p>

      <div className="mt-4 flex flex-col gap-1.5">
        {service.keys.length === 0 && <p className="px-1 text-xs text-neutral-500">No key yet.</p>}
        {service.keys.map((k) => {
          const active = k.id === service.activeId;
          const pill = keyPill(k, active);
          const info = Object.entries(k.info).map(([name, v]) => `${name.replace(/_/g, " ")}: ${String(v)}`);
          return (
            <div key={k.id} className="item flex flex-wrap items-center gap-x-3 gap-y-2 !rounded-[14px] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {k.label}
                  {k.fromEnv && <span className="ml-1.5 text-[11px] font-normal text-neutral-400">set in Vercel</span>}
                </p>
                <p className="truncate font-mono text-[11px] text-neutral-400">{k.masked}</p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  {k.uses} {k.uses === 1 ? "use" : "uses"} · last used {ago(k.lastUsed)}
                  {info.length ? ` · ${info.join(" · ")}` : ""}
                </p>
                {k.error && k.status !== "ok" && <p className="mt-0.5 text-[11px] text-red-400">{k.error}</p>}
              </div>
              <span className={`tag shrink-0 ${pill.tone}`}>{pill.text}</span>
              <div className="flex w-full items-center justify-end gap-1 sm:w-auto">
                {!active && (
                  <button
                    onClick={() => act(k.id, `/api/keys/${k.id}/activate`, { method: "POST" }, undefined)}
                    disabled={busy !== null}
                    className="btn-ghost !px-2.5 !py-1 text-xs"
                  >
                    Use this key
                  </button>
                )}
                <button
                  onClick={() =>
                    act(k.id, `/api/keys/${k.id}/test`, { method: "POST" }, (r) =>
                      toast(r.ok ? `${k.label}: working.` : `${k.label}: ${r.message}`, !r.ok)
                    )
                  }
                  disabled={busy !== null}
                  className="btn-ghost !px-2.5 !py-1 text-xs"
                >
                  {busy === k.id ? "Testing…" : "Test"}
                </button>
                {!k.fromEnv && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${k.label}"?`)) {
                        act(k.id, `/api/keys/${k.id}`, { method: "DELETE" }, undefined);
                        toast("Key removed.");
                      }
                    }}
                    disabled={busy !== null}
                    aria-label={`Remove ${k.label}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white hover:text-red-400"
                  >
                    <iconify-icon icon="solar:trash-bin-2-linear" className="text-base" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="label mt-4">Add backup key</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`Paste a${service.keys.length ? " backup" : "n"} ${service.label} key`}
          type="password"
          autoComplete="off"
          className="input flex-1 font-mono text-sm placeholder:font-sans"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="input text-sm sm:max-w-[150px]"
        />
        <button onClick={add} disabled={busy !== null} className="btn btn-primary shrink-0">
          {busy === "add" ? "Testing…" : "Save & test"}
        </button>
      </div>

      <details className="mt-3 text-xs text-neutral-500">
        <summary className="cursor-pointer select-none font-medium text-neutral-600">How to get a {service.label} key</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {service.how.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-2">{service.limits}</p>
      </details>
    </div>
  );
}
