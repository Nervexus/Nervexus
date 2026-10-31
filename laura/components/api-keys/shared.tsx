"use client";

import { useEffect, useState } from "react";

export type Issue = {
  id: number;
  service: string;
  label: string;
  kind: "down" | "key";
  title: string;
  detail: string;
  needsKey: boolean;
  resetAt: string | null;
  firstSeen: string;
  resolvedAt: string | null;
  snoozed: boolean;
};

export const KEYS_CHANGED = "laura:keys-changed";
export const OPEN_KEYS_TAB = "laura:open-keys-tab";
const TOAST = "laura:toast";

export function toast(text: string, bad = false) {
  window.dispatchEvent(new CustomEvent(TOAST, { detail: { text, bad } }));
}

export function ago(iso: string | null): string {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 48 * 60) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} days ago`;
}

export function inTime(iso: string | null): string | null {
  if (!iso) return null;
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (mins <= 0) return null;
  if (mins < 90) return `${mins} min`;
  if (mins < 48 * 60) return `${Math.round(mins / 60)} hours`;
  return `${Math.round(mins / 1440)} days`;
}

export function duration(from: string, to: string): string {
  const m = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000));
  return m < 90 ? `${m} min` : m < 2880 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} days`;
}

/** "Paste a new <service> key" + Save & test, used by the pop-up and the problems card. */
export function KeyPasteBox({ service, label, onSaved }: { service: string; label: string; onSaved?: () => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!value.trim()) return toast("Paste the key first.", true);
    setBusy(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, key: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save that key.");
      const ok = data.result?.ok !== false;
      toast(ok ? "Key saved and working." : `Saved, but the test failed: ${data.result?.message ?? "key not accepted"}`, !ok);
      setValue("");
      window.dispatchEvent(new Event(KEYS_CHANGED));
      onSaved?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save that key.", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2.5 flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Paste a new ${label} key`}
        type="password"
        autoComplete="off"
        className="input min-w-0 flex-1 font-mono text-sm placeholder:font-sans"
      />
      <button onClick={save} disabled={busy} className="btn btn-primary shrink-0 !px-4 text-xs">
        {busy ? "Testing…" : "Save & test"}
      </button>
    </div>
  );
}

export function IssueRow({ issue, onSaved }: { issue: Issue; onSaved?: () => void }) {
  const down = issue.kind === "down";
  return (
    <div className={`item !rounded-[16px] p-3.5 ${down ? "issue-down" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-800">{issue.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">{issue.detail}</p>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-neutral-400">{ago(issue.firstSeen)}</span>
      </div>
      {issue.needsKey && <KeyPasteBox service={issue.service} label={issue.label} onSaved={onSaved} />}
    </div>
  );
}

/** Small bottom toast for key and issue actions. */
export function Toaster() {
  const [msg, setMsg] = useState<{ text: string; bad: boolean; at: number } | null>(null);

  useEffect(() => {
    const on = (e: Event) => setMsg({ ...(e as CustomEvent<{ text: string; bad: boolean }>).detail, at: Date.now() });
    window.addEventListener(TOAST, on);
    return () => window.removeEventListener(TOAST, on);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4500);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[80] flex justify-center px-4 sm:bottom-8">
      <div
        key={msg.at}
        className={`enter rounded-full px-4 py-2.5 text-sm font-medium shadow-lg ${msg.bad ? "bg-red text-white" : "bg-neutral-900 text-white"}`}
        role="status"
      >
        {msg.text}
      </div>
    </div>
  );
}
