"use client";

import { useEffect, useRef, useState } from "react";
import { type VoiceOrbHandle } from "@/components/VoiceOrb";
import { FlowDiagram } from "@/components/FlowDiagram";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";

type Message = { role: "user" | "assistant"; content: string; createdAt?: string };

function formatTime(iso?: string): string {
  if (!iso) return "now";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  return (
    <div
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
        role === "user" ? "bg-neutral-200 text-neutral-900" : "bg-neutral-800 text-neutral-300"
      }`}
    >
      {role === "user" ? "Y" : "L"}
    </div>
  );
}

export default function LauraPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "activity">("chat");
  const [pulseTools, setPulseTools] = useState<string[]>([]);
  const [pulseKey, setPulseKey] = useState(0);
  const [activityKey, setActivityKey] = useState(0);
  const orbRef = useRef<VoiceOrbHandle>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((body) => {
        setMessages(
          body.messages?.length
            ? body.messages
            : [
                {
                  role: "assistant",
                  content:
                    "Hey, I'm Laura. Type below or tap the orb to talk — I can take notes for you, but email, calendar, and calls aren't wired up yet.",
                },
              ]
        );
      })
      .catch(() => setError("Couldn't load chat history."))
      .finally(() => setLoaded(true));
  }, []);

  async function sendMessage(text: string, speakReply: boolean) {
    if (!text || sending) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, createdAt: new Date().toISOString() },
    ]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: body.reply, createdAt: new Date().toISOString() },
      ]);
      if (body.toolsUsed?.length) {
        setPulseTools(body.toolsUsed);
        setPulseKey((k) => k + 1);
        setActivityKey((k) => k + 1);
      }
      if (speakReply) await orbRef.current?.speak(body.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.trim(), false);
    }
  }

  return (
    <GsapEntrance className="relative mx-auto max-w-3xl px-6 pb-20">
      <div className="gsap-entrance mb-8 flex w-full items-center justify-between gap-3">
        <div>
          <h1 className="font-thin text-2xl tracking-tight text-neutral-100">Laura</h1>
          <p className="mt-0.5 text-xs text-neutral-600">/ personal assistant</p>
        </div>
        <Pill>
          <span className="normal-case tracking-normal">online</span>
        </Pill>
      </div>

      <div className="gsap-entrance flex flex-col items-center">
        <FlowDiagram
          ref={orbRef}
          onTranscript={(text) => sendMessage(text, true)}
          pulseTools={pulseTools}
          pulseKey={pulseKey}
        />
      </div>

      <div className="gsap-entrance mt-10 flex gap-1 border-b border-neutral-800/60">
        {(["chat", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-3 py-2 font-mono text-xs capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-neutral-100 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "chat" ? (
        <div className="gsap-entrance flex flex-col gap-4 py-6">
          {!loaded && <p className="text-sm text-neutral-600">Loading…</p>}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`group flex items-end gap-2 ${
                m.role === "user" ? "flex-row-reverse self-end" : "self-start"
              }`}
            >
              <Avatar role={m.role} />
              <div className="flex max-w-[75%] flex-col gap-1">
                <div
                  className={`rounded-xl px-4 py-2.5 text-sm font-light leading-relaxed ${
                    m.role === "user"
                      ? "bg-neutral-100 text-neutral-900"
                      : "border border-neutral-800/60 bg-neutral-900/40 text-neutral-100 backdrop-blur-sm"
                  }`}
                >
                  {m.content}
                </div>
                <span
                  className={`text-[10px] text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100 ${
                    m.role === "user" ? "self-end" : "self-start"
                  }`}
                >
                  {formatTime(m.createdAt)}
                </span>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-end gap-2 self-start">
              <Avatar role="assistant" />
              <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/40 px-4 py-2.5 text-sm text-neutral-500">
                …
              </div>
            </div>
          )}
          {error && (
            <div className="self-start rounded-xl bg-red-950/60 px-4 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="gsap-entrance py-6">
          <ActivityFeed refreshKey={activityKey} />
        </div>
      )}

      <div className="gsap-entrance gradient-border flex items-end gap-3 rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-3 backdrop-blur-md">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Laura…"
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm font-light text-neutral-100 outline-none placeholder:text-neutral-600"
        />
        <Button onClick={() => sendMessage(input.trim(), false)} disabled={sending || !input.trim()}>
          Send
        </Button>
      </div>
    </GsapEntrance>
  );
}
