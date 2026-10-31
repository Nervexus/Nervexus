"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  label: string;
  detail: string;
  limits: string;
  how: readonly string[];
  main: { maskedKey: string } | null;
};
type BackupKey = { id: string; service: string; label: string; maskedKey: string; active: boolean };
type TestState = "ok" | "limited" | "invalid" | "error";
type TestResult = { status: TestState; message: string };
type Row = { id: string; label: string; masked: string; source: "main" | "backup"; active: boolean; index: number };

const PILL: Record<TestState | "inuse" | "ready" | "paused", { text: string; tone: string }> = {
  inuse: { text: "In use", tone: "!border-green/20 !bg-green-soft !text-green" },
  ready: { text: "Ready", tone: "" },
  paused: { text: "Paused", tone: "opacity-70" },
  ok: { text: "Working", tone: "!border-green/20 !bg-green-soft !text-green" },
  limited: { text: "At its limit", tone: "tag-amber" },
  invalid: { text: "Rejected", tone: "tag-red" },
  error: { text: "Couldn't check", tone: "tag-amber" },
};

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
        setError(null);
      })
      .catch(() => setError("Couldn't load API keys."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-500">
        Each service can hold several keys. Laura uses the first working one, and when it hits a limit or gets
        rejected she moves to the next, so add as many backups as you like.
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!loaded && <p className="text-xs text-neutral-400">Loading…</p>}
      {services.map((s) => (
        <ServicePanel key={s.id} service={s} keys={keys.filter((k) => k.service === s.id)} onChange={load} />
      ))}
    </div>
  );
}

function ServicePanel({ service, keys, onChange }: { service: Service; keys: BackupKey[]; onChange: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, TestResult>>({});
  const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null);

  const rows: Row[] = [
    ...(service.main
      ? [{ id: "main", label: "Main key", masked: `${service.main.maskedKey} · set in Vercel`, source: "main" as const, active: true, index: -1 }]
      : []),
    ...keys.map((k, i) => ({ id: k.id, label: k.label, masked: k.maskedKey, source: "backup" as const, active: k.active, index: i })),
  ];
  const usable = rows.filter((r) => r.active && tests[r.id]?.status !== "invalid" && tests[r.id]?.status !== "limited");
  const inUseId = usable[0]?.id;
  const anyBad = rows.some((r) => tests[r.id] && tests[r.id].status !== "ok");
  const header = rows.length === 0 ? "Not set up" : !inUseId ? "Needs attention" : anyBad ? "Check" : "Working";
  const headerTone =
    header === "Working" ? "!border-green/20 !bg-green-soft !text-green" : header === "Needs attention" ? "tag-red" : header === "Check" ? "tag-amber" : "";

  async function test(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/settings/api-keys/${id}/test`, { method: "POST" });
      const data = await res.json();
      if (data.status) setTests((t) => ({ ...t, [id]: { status: data.status, message: data.message } }));
      return data as { ok: boolean; message: string };
    } finally {
      setBusy(null);
    }
  }

  async function add() {
    if (!apiKey.trim()) return setNote({ text: "Paste a key first.", bad: true });
    setBusy("add");
    setNote(null);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: service.id, label: label.trim(), apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save.");
      setApiKey("");
      setLabel("");
      setTests((t) => ({ ...t, [data.key.id]: { status: "ok", message: "Working" } }));
      setNote({ text: `Key added and working: ${data.key.label}`, bad: false });
      onChange();
    } catch (err) {
      setNote({ text: err instanceof Error ? err.message : "Couldn't save.", bad: true });
    } finally {
      setBusy(null);
    }
  }

  async function makeFirst(row: Row) {
    setBusy(row.id);
    const ids = [row.id, ...keys.map((k) => k.id).filter((id) => id !== row.id)];
    await fetch("/api/settings/api-keys", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: service.id, ids }),
    });
    if (!row.active) {
      await fetch(`/api/settings/api-keys/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
    }
    setBusy(null);
    setNote({
      text: service.main ? `${row.label} is now the first backup. The main key in Vercel is still tried first.` : `Swapped. ${row.label} is now in use.`,
      bad: false,
    });
    onChange();
  }

  async function togglePause(row: Row) {
    await fetch(`/api/settings/api-keys/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    onChange();
  }

  async function remove(row: Row) {
    if (!confirm(`Remove "${row.label}"?`)) return;
    await fetch(`/api/settings/api-keys/${row.id}`, { method: "DELETE" });
    setNote({ text: "Key removed.", bad: false });
    onChange();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-neutral-800">{service.label}</h3>
        <span className={`tag shrink-0 ${headerTone}`}>{header}</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">
        {service.detail}. {service.limits}
      </p>

      <div className="mt-4 flex flex-col gap-1.5">
        {rows.length === 0 && <p className="px-1 text-xs text-neutral-500">No key yet.</p>}
        {rows.map((row) => {
          const result = tests[row.id];
          const pill = result ? PILL[result.status] : !row.active ? PILL.paused : row.id === inUseId ? PILL.inuse : PILL.ready;
          return (
            <div key={row.id} className={`item flex flex-wrap items-center gap-x-3 gap-y-2 !rounded-[14px] px-3 py-2.5 ${row.active ? "" : "opacity-60"}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800">{row.label}</p>
                <p className="truncate font-mono text-[11px] text-neutral-400">{row.masked}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className={`tag ${pill.tone}`}>{row.id === inUseId && result?.status === "ok" ? "In use" : pill.text}</span>
                {result && result.status !== "ok" && <span className="text-[10.5px] text-neutral-400">{result.message}</span>}
              </div>
              <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto">
                {row.source === "backup" && row.id !== inUseId && (
                  <button onClick={() => makeFirst(row)} disabled={busy !== null} className="btn-ghost !px-2.5 !py-1 text-xs">
                    Use this
                  </button>
                )}
                <button onClick={() => test(row.id)} disabled={busy !== null} className="btn-ghost !px-2.5 !py-1 text-xs">
                  {busy === row.id ? "Testing…" : "Test"}
                </button>
                {row.source === "backup" && (
                  <>
                    <button onClick={() => togglePause(row)} disabled={busy !== null} className="btn-ghost !px-2.5 !py-1 text-xs">
                      {row.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => remove(row)}
                      disabled={busy !== null}
                      aria-label={`Remove ${row.label}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white hover:text-red-400"
                    >
                      <iconify-icon icon="solar:trash-bin-2-linear" className="text-base" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`Paste a${rows.length ? " backup" : "n"} API key`}
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
          {busy === "add" ? "Testing…" : "Add & test"}
        </button>
      </div>
      {note && <p className={`mt-2 text-xs ${note.bad ? "text-red-400" : "text-green"}`}>{note.text}</p>}

      <details className="mt-3 text-xs text-neutral-500">
        <summary className="cursor-pointer select-none font-medium text-neutral-600">How to get a {service.label} key</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {service.how.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
    </div>
  );
}
