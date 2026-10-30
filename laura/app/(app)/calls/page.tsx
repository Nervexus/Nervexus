"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { SidebarCard, Chip, Stat } from "@/components/SidebarCard";
import { CallLogCard } from "@/components/CallLogCard";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";

type Log = {
  id: string;
  kind: string;
  message: string;
  status: string;
  error: string | null;
  createdAt: string;
};

const QUICK_MESSAGES = [
  "Hey, just checking in.",
  "Time to leave for your shift.",
  "Don't forget your reminder today.",
];

export default function CallsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [kind, setKind] = useState<"call" | "sms">("call");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/calls")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs ?? []))
      .catch(() => setError("Couldn't load call history."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  async function send() {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Couldn't place the ${kind}.`);
      setMessage("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Couldn't place the ${kind}.`);
    } finally {
      setSending(false);
    }
  }

  const calls = logs.filter((l) => l.kind === "call").length;
  const texts = logs.filter((l) => l.kind === "sms").length;
  const failed = logs.filter((l) => l.status === "failed").length;

  return (
    <GsapEntrance className="relative mx-auto max-w-5xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance flex items-center gap-3">
        <h1 className="page-title">Calls & texts</h1>
        <Pill>{logs.length} sent</Pill>
      </div>
      <p className="gsap-entrance mt-2 text-sm text-neutral-500">
        have Laura send you an urgent notification or a plain message, via Telegram — free, but
        not an actual ringing phone call
      </p>

      <div className="gsap-entrance relative mt-8 card p-5">
        <div className="tabs">
          {(["call", "sms"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`tab ${kind === k ? "is-active" : ""}`}
            >
              {k === "call" ? "Call me" : "Text me"}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            kind === "call" ? "What should the urgent message say?" : "What should the message say?"
          }
          rows={3}
          className="mt-5 w-full resize-none input text-base font-normal text-neutral-700 outline-none placeholder:text-neutral-400"
        />

        <div className="mt-3.5 flex flex-wrap gap-2">
          {QUICK_MESSAGES.map((suggestion) => (
            <Chip key={suggestion} onClick={() => setMessage(suggestion)}>
              {suggestion}
            </Chip>
          ))}
        </div>

        <div className="mt-3.5 flex justify-end">
          <Button variant="accent" onClick={send} disabled={!message.trim() || sending}>
            {sending ? "Sending…" : "Send now"}
          </Button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          {error && <p className="gsap-entrance mb-4 text-sm text-red-400">{error}</p>}

          {loaded && logs.length === 0 ? (
            <EmptyState
              icon={<iconify-icon icon="solar:phone-calling-linear" className="text-lg" />}
              title="Nothing sent yet"
              description="Ask Laura to send you a message, or try it above."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {logs.map((log) => (
                <div key={log.id} className="gsap-entrance">
                  <CallLogCard
                    kind={log.kind}
                    message={log.message}
                    status={log.status}
                    error={log.error}
                    createdAt={log.createdAt}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="gsap-entrance flex flex-col gap-4">
          <SidebarCard title="Stats">
            <div className="flex flex-col gap-2">
              <Stat label="Calls" value={calls} />
              <Stat label="Texts" value={texts} />
              <Stat label="Failed" value={failed} />
            </div>
          </SidebarCard>

          <SidebarCard title="How this works">
            <p className="text-xs leading-relaxed text-neutral-500">
              Messages go out through a Telegram bot to your own chat with it — free, instant, no
              trial limits. &quot;Call me&quot; sends an urgent-styled message rather than an
              actual ringing phone call, since no free provider can place a real one.
            </p>
          </SidebarCard>
        </aside>
      </div>
    </GsapEntrance>
  );
}
