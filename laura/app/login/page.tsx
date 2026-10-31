"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { browserSupportsWebAuthn, startAuthentication } from "@simplewebauthn/browser";
import { LogoMark } from "@/components/NavIcon";
import { hasPasskeyHere, markPasskeyHere } from "@/lib/passkey-device";

// Only same-site paths, so ?next= can't be used to bounce you to another site.
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get("next") ?? "/laura";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/laura";
}

const noopSubscribe = () => () => {};

// Marks that the app has been unlocked in this browser session, so the
// landing page's "Get access" can go straight in until the app is closed.
function markSessionOpen() {
  try {
    sessionStorage.setItem("laura_session_open", "1");
  } catch {
    // no sessionStorage -- next open will just ask again
  }
}

type Mode = "checking" | "faceid" | "password";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [chosenMode, setMode] = useState<Mode>("checking");
  const canUsePasskey = useSyncExternalStore(noopSubscribe, browserSupportsWebAuthn, () => false);
  const passkeyHere = useSyncExternalStore(noopSubscribe, hasPasskeyHere, () => false);
  // Face ID opens by itself only where it was set up for this site; anywhere
  // else (or without passkey support) it starts on the password.
  const mode: Mode = !canUsePasskey ? "password" : chosenMode === "checking" && !passkeyHere ? "password" : chosenMode;

  async function signInWithPasskey(auto = false) {
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
      if (!optRes.ok) {
        // No Face ID set up on this account yet: fall back to the password.
        setMode("password");
        if (!auto) setError(options.error ?? "Face ID isn't available.");
        setBusy(false);
        return;
      }
      setMode("faceid");
      const response = await startAuthentication({ optionsJSON: options });
      const res = await fetch("/api/auth/passkey/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "verify", response }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Face ID didn't work.");
      markPasskeyHere();
      markSessionOpen();
      window.location.replace(safeNext());
    } catch (err) {
      // A cancelled prompt, or a browser that won't open Face ID without a
      // tap, isn't an error worth showing -- the button is right there.
      const cancelled = err instanceof Error && err.name === "NotAllowedError";
      setError(cancelled ? null : err instanceof Error ? err.message : "Face ID didn't work.");
      setBusy(false);
    }
  }

  // Open Face ID as soon as the page loads, on devices that support it.
  useEffect(() => {
    if (!browserSupportsWebAuthn() || !hasPasskeyHere()) return;
    const t = setTimeout(() => void signInWithPasskey(true), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      markSessionOpen();
      window.location.replace(safeNext());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
      setBusy(false);
    }
  }

  const faceIdButton = (
    <button
      type="button"
      onClick={() => signInWithPasskey()}
      disabled={busy}
      className="item mt-8 flex w-full flex-col items-center gap-3 py-8 text-text transition-colors hover:!border-white hover:!bg-white/70 disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" className="h-12 w-12 text-accent" aria-hidden>
        <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
        <path d="M9 9v1.5M15 9v1.5M12 9v4l-1 .5M9.5 16a3.5 3.5 0 0 0 5 0" />
      </svg>
      <span className="text-[13px] font-semibold text-neutral-700">
        {busy ? "Checking…" : "Unlock with Face ID"}
      </span>
    </button>
  );

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={signIn}
        className={`modal w-full max-w-sm ${error ? "shake" : ""}`}
        key={error ?? "ok"}
      >
        <div className="flex items-center gap-3">
          <span className="icon-tile relative !h-11 !w-11">
            <span className="logo-ring absolute inset-0 rounded-[14px]" aria-hidden />
            <LogoMark className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[20px] font-semibold leading-tight">Welcome back</p>
            <p className="text-[13px] text-muted">Sign in to LAURA</p>
          </div>
        </div>

        {mode === "checking" && <div className="mt-8 h-[124px]" aria-hidden />}

        {mode === "faceid" && (
          <>
            {faceIdButton}
            <p className="mt-3 min-h-5 text-xs text-red-400" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("password");
              }}
              className="btn-ghost mt-2 w-full justify-center"
            >
              Use password instead
            </button>
          </>
        )}

        {mode === "password" && (
          <>
            <label htmlFor="password" className="label mt-8 block">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input mt-2"
            />
            <p className="mt-3 min-h-5 text-xs text-red-400" role="alert">
              {error}
            </p>
            <button
              type="submit"
              disabled={!password || busy}
              className="btn btn-primary btn-hero mt-4 w-full"
            >
              {busy ? "Signing in…" : "Get access"}
            </button>
            {canUsePasskey && (
              <button
                type="button"
                onClick={() => signInWithPasskey()}
                disabled={busy}
                className="btn-ghost mt-3 w-full justify-center"
              >
                Use Face ID instead
              </button>
            )}
          </>
        )}
      </form>
    </main>
  );
}
