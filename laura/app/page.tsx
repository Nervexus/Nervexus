"use client";

import { useEffect, useRef, useState } from "react";
import { type VoiceOrbHandle } from "@/components/VoiceOrb";
import { DotGrid } from "@/components/DotGrid";
import { FlowDiagram } from "@/components/FlowDiagram";
import { ActivityFeed } from "@/components/ActivityFeed";

type Message = { role: "user" | "assistant"; content: string; createdAt?: string };

function formatTime(iso?: string): string {
  if (!iso) return "now";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  return (
    <div
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
        role === "user" ? "bg-neutral-200 text-neutral-900" : "bg-emerald-500/20 text-emerald-300"
      }`}
    >
      {role === "user" ? "Y" : "L"}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "activity">("chat");
  const [pulseTools, setPulseTools] = useState<string[]>([]);
  const [pulseKey, setPulseKey] = useState(0);
  const [activityKey, setActivityKey] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
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

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function sendMessage(text: string, speakReply: boolean) {
    if (!text || sending) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, createdAt: new Date().toISOString() },
    ]);
    setInput("");
    setSending(true);
    setError(null);
    scrollToBottom();

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
      scrollToBottom();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.trim(), false);
    }
  }

  return (
    <div className="flex h-screen flex-col sm:h-auto sm:flex-1">
      <div className="relative overflow-hidden border-b border-neutral-800 bg-neutral-950 px-6 pb-10 pt-6">
        <DotGrid />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center">
          <div className="mb-8 flex w-full items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold text-neutral-100">Laura</h1>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  Assistant
                </span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-600">/ personal</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              online
            </span>
          </div>

          <FlowDiagram
            ref={orbRef}
            onTranscript={(text) => sendMessage(text, true)}
            pulseTools={pulseTools}
            pulseKey={pulseKey}
          />
        </div>
      </div>

      <div className="flex gap-1 border-b border-neutral-800 px-6 pt-3">
        {(["chat", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-emerald-400 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "chat" ? (
        <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
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
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-neutral-100 text-neutral-900"
                        : "bg-neutral-900 text-neutral-100"
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
                <div className="rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm text-neutral-500">
                  …
                </div>
              </div>
            )}
            {error && (
              <div className="self-start rounded-2xl bg-red-950 px-4 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ActivityFeed refreshKey={activityKey} />
        </div>
      )}

      <div className="border-t border-neutral-800 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Laura…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
          />
          <button
            onClick={() => sendMessage(input.trim(), false)}
            disabled={sending || !input.trim()}
            className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 transition-opacity disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
