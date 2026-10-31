"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { markPasskeyHere } from "@/lib/passkey-device";
import { Section } from "@/components/ui/layout";

type Passkey = { id: string; label: string | null; createdAt: string; lastUsedAt: string | null };

const noopSubscribe = () => () => {};

function deviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android phone";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  return "This device";
}

/** Add or remove passkeys (Face ID / Touch ID / fingerprint) for signing in.
 * A passkey belongs to the device and the domain it was created on. */
export function FaceIdSettings() {
  const supported = useSyncExternalStore(noopSubscribe, browserSupportsWebAuthn, () => false);
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/auth/passkey")
      .then((r) => r.json())
      .then((d) => setPasskeys(d.passkeys ?? []))
      .catch(() => setPasskeys([]));
  }
  useEffect(load, []);

  async function add() {
    setBusy(true);
    setMessage(null);
    try {
      const optRes = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "options" }),
      });
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error ?? "Couldn't start Face ID setup.");
      const response = await startRegistration({ optionsJSON: options });
      const res = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "verify", response, label: deviceLabel() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save Face ID.");
      markPasskeyHere();
      setMessage("Face ID is set up on this device.");
      load();
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "InvalidStateError") markPasskeyHere();
      setMessage(
        name === "NotAllowedError"
          ? null
          : name === "InvalidStateError"
            ? "This device already has Face ID set up."
            : err instanceof Error
              ? err.message
              : "Couldn't set up Face ID."
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/auth/passkey?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  }

  return (
    <Section
      title="Face ID"
      icon="solar:face-scan-square-linear"
      summary={passkeys === null ? "…" : passkeys.length ? `${passkeys.length} device${passkeys.length === 1 ? "" : "s"}` : "Not set up"}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-md text-[12.5px] text-muted">
          Sign in with Face ID, Touch ID or your fingerprint instead of the password. Set it up once on each device
          you use.
        </p>
        <button
          onClick={add}
          disabled={busy || !supported}
          className="btn btn-primary shrink-0"
        >
          {busy ? "Waiting…" : "Add this device"}
        </button>
      </div>
      {!supported && <p className="mt-3 text-sm text-neutral-500">This browser doesn&apos;t support passkeys.</p>}
      {message && <p className="mt-3 text-sm text-neutral-600">{message}</p>}
      {passkeys && passkeys.length > 0 && (
        <div className="mt-3 flex flex-col">
          {passkeys.map((p) => (
            <div key={p.id} className="flex items-center gap-4 border-t border-line py-3">
              <iconify-icon icon="solar:smartphone-linear" className="text-base text-muted" />
              <span className="flex-1 text-sm font-normal text-neutral-700">{p.label ?? "Passkey"}</span>
              <span className="label">
                {p.lastUsedAt ? `Used ${new Date(p.lastUsedAt).toLocaleDateString()}` : `Added ${new Date(p.createdAt).toLocaleDateString()}`}
              </span>
              <button
                onClick={() => remove(p.id)}
                className="label hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
