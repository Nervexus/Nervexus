"use client";

import { useState, useSyncExternalStore } from "react";
import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";

// Only same-site paths, so ?next= can't be used to bounce you to another site.
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get("next") ?? "/laura";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/laura";
}

const noopSubscribe = () => () => {};

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canUsePasskey = useSyncExternalStore(noopSubscribe, browserSupportsWebAuthn, () => false);

  async function signInWithPasskey() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const optRes = await fetch("/api/auth/passkey/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "options" }),
      });
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error ?? "Face ID isn't available.");
      const response = await startAuthentication({ optionsJSON: options });
      const res = await fetch("/api/auth/passkey/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "verify", response }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Face ID didn't work.");
      window.location.replace(safeNext());
    } catch (err) {
      const cancelled = err instanceof Error && err.name === "NotAllowedError";
      setError(cancelled ? null : err instanceof Error ? err.message : "Face ID didn't work.");
      setBusy(false);
    }
  }


  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't sign in.");
      window.location.replace(safeNext());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
      setBusy(false);
    }
  }

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={signIn}
        className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#1b1b1d] to-[#121213] p-10 shadow-[0_40px_90px_-30px_rgba(0,0,0,1)]"
      >
        <p className="flex items-center gap-3 text-sm font-medium tracking-[0.3em] text-neutral-100">
          LAURA <span className="h-1 w-1 rounded-full bg-neutral-200" />
        </p>

        <label htmlFor="password" className="mt-16 block font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-400">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-3 w-full border-b border-[var(--calendar-accent)]/70 bg-transparent pb-2 text-lg font-light text-neutral-100 outline-none focus:border-[var(--calendar-accent)]"
        />
        <p className="mt-3 min-h-5 text-xs text-red-400" role="alert">
          {error}
        </p>

        <button
          type="submit"
          disabled={!password || busy}
          className="group mt-10 flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-400 transition-colors hover:text-neutral-100 disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Get access"}
          <span className="relative h-px w-20 bg-neutral-500 transition-colors group-hover:bg-[var(--calendar-accent)]">
            <span className="absolute -top-[3px] right-0 h-[7px] w-[7px] rotate-45 border-r border-t border-neutral-500 group-hover:border-[var(--calendar-accent)]" />
          </span>
        </button>
        {canUsePasskey && (
          <button
            type="button"
            onClick={signInWithPasskey}
            disabled={busy}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] py-3 text-sm text-neutral-200 transition-colors hover:border-violet-400/40 hover:bg-violet-500/10 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" className="h-5 w-5 text-violet-300" aria-hidden>
              <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
              <path d="M9 9v1.5M15 9v1.5M12 9v4l-1 .5M9.5 16a3.5 3.5 0 0 0 5 0" />
            </svg>
            Use Face ID
          </button>
        )}
      </form>
    </main>
  );
}
