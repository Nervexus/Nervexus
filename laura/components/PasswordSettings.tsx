"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";

/** Settings > Password: set or change the main sign-in password. */
export function PasswordSettings() {
  const [isSet, setIsSet] = useState<boolean | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/password")
      .then((r) => r.json())
      .then((d) => setIsSet(Boolean(d.isSet)))
      .catch(() => setIsSet(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) {
      setMsg({ ok: false, text: "The two new passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save the password.");
      setMsg({ ok: true, text: "Password saved." });
      setCurrent("");
      setNext("");
      setConfirm("");
      setIsSet(true);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Couldn't save the password." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="card card-pad">
      <h2 className="text-[15px] font-semibold text-text">Password</h2>
      <p className="text-[12.5px] text-muted">
        {isSet === null
          ? "…"
          : isSet
            ? "Your sign-in password. Change it any time."
            : "No password set yet. Choose one so you can sign in without Face ID."}
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:max-w-sm">
        {isSet && (
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Current password"
            className="input"
          />
        )}
        <input
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New password"
          className="input"
        />
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="input"
        />
        {msg && <p className={`text-[12.5px] ${msg.ok ? "text-lilac" : "text-red-400"}`}>{msg.text}</p>}
        <Button type="submit" disabled={busy || !next || !confirm || (!!isSet && !current)} className="self-start">
          {busy ? "Saving…" : isSet ? "Change password" : "Set password"}
        </Button>
      </div>
    </form>
  );
}
