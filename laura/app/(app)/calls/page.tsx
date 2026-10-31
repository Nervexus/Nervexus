"use client";

import { useEffect, useState } from "react";
import { Chip } from "@/components/SidebarCard";
import { CallLogCard } from "@/components/CallLogCard";
import { Pill } from "@/components/Pill";
import { GsapEntrance } from "@/components/GsapEntrance";
import { Empty, Group, PageHeader, Row, Section } from "@/components/ui/layout";

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
    <GsapEntrance className="relative mx-auto max-w-3xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance">
        <PageHeader title="Calls & texts" meta={<Pill>{logs.length} sent</Pill>} sub="Laura messages you on Telegram. Free, but not a real ringing call." />
      </div>

      <div className="gsap-entrance card p-4">
        <div className="tabs">
          {(["call", "sms"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`tab ${kind === k ? "is-active" : ""}`}>
              {k === "call" ? "Call me" : "Text me"}
            </button>
          ))}
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={kind === "call" ? "What should the urgent message say?" : "What should the message say?"}
          rows={2}
          className="input mt-3 w-full resize-none text-sm"
        />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {QUICK_MESSAGES.map((suggestion) => (
            <Chip key={suggestion} onClick={() => setMessage(suggestion)}>
              {suggestion}
            </Chip>
          ))}
          <button onClick={send} disabled={!message.trim() || sending} className="btn btn-primary ml-auto">
            {sending ? "Sending…" : "Send now"}
          </button>
        </div>
      </div>

      {error && <p className="gsap-entrance mt-4 text-sm text-red-400">{error}</p>}

      <div className="gsap-entrance mt-6">
        <Group title="History">
          {!loaded ? (
            <Empty>Loading…</Empty>
          ) : logs.length === 0 ? (
            <Empty>Nothing sent yet. Ask Laura to message you, or try it above.</Empty>
          ) : (
            logs.map((log) => (
              <CallLogCard key={log.id} kind={log.kind} message={log.message} status={log.status} error={log.error} createdAt={log.createdAt} />
            ))
          )}
        </Group>
      </div>

      <div className="gsap-entrance mt-6">
        <Group>
          <Section title="Overview" icon="solar:chart-2-linear" summary={`${calls} calls · ${texts} texts${failed ? ` · ${failed} failed` : ""}`}>
            {[
              { label: "Calls", value: calls },
              { label: "Texts", value: texts },
              { label: "Failed", value: failed },
            ].map((s) => (
              <Row key={s.label} title={s.label} trailing={<span className="font-mono text-[13px] tabular-nums text-muted">{s.value}</span>} />
            ))}
          </Section>
          <Section title="How this works" icon="solar:info-circle-linear">
            <p className="text-[13px] leading-relaxed text-muted">
              Messages go out through a Telegram bot to your own chat with it: free, instant, no trial limits. &quot;Call
              me&quot; sends an urgent-styled message rather than a ringing phone call, since no free provider can place a
              real one.
            </p>
          </Section>
        </Group>
      </div>
    </GsapEntrance>
  );
}
