"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceOrb, type VoiceOrbHandle } from "@/components/VoiceOrb";
import { ActivityFeed } from "@/components/ActivityFeed";
import { TomorrowBriefing } from "@/components/TomorrowBriefing";
import { GsapEntrance } from "@/components/GsapEntrance";

type Message = { role: "user" | "assistant"; content: string; createdAt?: string };

const SUGGESTIONS = [
  { icon: "solar:clock-circle-linear", label: "Set a reminder", prompt: "Remind me tomorrow at 9am to " },
  { icon: "solar:bus-linear", label: "Plan my commute", prompt: "When should I leave for my next shift?" },
  { icon: "solar:chef-hat-linear", label: "Find a dinner spot", prompt: "Find me a good dinner spot near " },
  { icon: "solar:chat-round-line-linear", label: "Text me", prompt: "Text me a reminder to " },
];

/** Laura's mark: two triangles meeting at a twist, drawn as one stroke. */
function LauraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <path
        d="M20 10 L46 10 L20 54 L46 54 Z"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
    </svg>
  );
}

export default function LauraPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "activity">("chat");
  const [activityKey, setActivityKey] = useState(0);
  const orbRef = useRef<VoiceOrbHandle>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((body) => setMessages(body.messages ?? []))
      .catch(() => setError("Couldn't load chat history."));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, sending]);

  async function sendMessage(text: string, speakReply: boolean) {
    if (!text || sending) return;
    setMessages((prev) => [...prev, { role: "user", content: text, createdAt: new Date().toISOString() }]);
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
      setMessages((prev) => [...prev, { role: "assistant", content: body.reply, createdAt: new Date().toISOString() }]);
      if (body.toolsUsed?.length) setActivityKey((k) => k + 1);
      if (speakReply) await orbRef.current?.speak(body.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  function applySuggestion(prompt: string) {
    setInput(prompt);
    inputRef.current?.focus();
  }

  const hasConversation = messages.length > 0;

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-6 pb-10">
      {/* Light beam + soft halo, the one bold gesture on the page. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex h-[680px] justify-center overflow-hidden" aria-hidden>
        <div className="h-[420px] w-[3px] bg-gradient-to-b from-transparent via-white/70 to-transparent blur-[2px]" />
        <div className="absolute top-0 h-[460px] w-[140px] bg-gradient-to-b from-white/0 via-white/[0.12] to-white/0 blur-2xl" />
        <div className="absolute top-[160px] h-[360px] w-[360px] rounded-full bg-white/[0.06] blur-3xl" />
      </div>
      <div className="laura-stars pointer-events-none fixed inset-0 -z-20 opacity-60" aria-hidden />

      <div className="flex items-center justify-end gap-1 pt-2">
        {(["chat", "activity"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 font-mono text-[11px] capitalize tracking-wide transition-colors ${
              tab === t ? "bg-white/10 text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        className={`flex flex-col items-center text-center transition-all duration-700 ${
          hasConversation ? "pt-6" : "pt-[14vh]"
        }`}
      >
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-full bg-white/30 blur-2xl" />
          <LauraMark
            className={`text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.7)] transition-all duration-700 ${
              hasConversation ? "h-9 w-9" : "h-16 w-16"
            }`}
          />
        </div>
        {!hasConversation && (
          <h1 className="mt-7 text-balance text-3xl font-medium tracking-tight text-white sm:text-4xl">
            How can I help you today?
          </h1>
        )}
      </div>

      {tab === "activity" ? (
        <div className="mt-8 flex-1">
          <ActivityFeed refreshKey={activityKey} />
        </div>
      ) : (
        <div className="mt-8 flex flex-1 flex-col gap-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] font-light leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md bg-white text-neutral-900"
                    : "rounded-bl-md border border-white/10 bg-white/[0.04] text-neutral-100 backdrop-blur-md"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-4">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/70"
                    style={{ animationDelay: `${d * 160}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          <div ref={endRef} />
        </div>
      )}

      <div className={`sticky bottom-4 ${hasConversation ? "mt-6" : "mt-10"}`}>
        <div className="relative rounded-[22px] border border-white/15 bg-white/[0.05] p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input.trim(), false);
              }
            }}
            placeholder="What do you want to know?"
            rows={2}
            className="w-full resize-none bg-transparent px-2 pt-1 text-[15px] font-light text-white outline-none placeholder:text-neutral-500"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-neutral-300">
              <iconify-icon icon="solar:stars-minimalistic-linear" className="text-sm"></iconify-icon>
              Laura
            </span>
            <div className="flex items-center gap-1.5">
              <VoiceOrb ref={orbRef} compact onTranscript={(text) => sendMessage(text, true)} />
              <button
                onClick={() => sendMessage(input.trim(), false)}
                disabled={sending || !input.trim()}
                aria-label="Send"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-950 shadow-[0_0_20px_rgba(255,255,255,0.35)] transition-all hover:shadow-[0_0_28px_rgba(255,255,255,0.55)] disabled:bg-white/15 disabled:text-neutral-500 disabled:shadow-none"
              >
                <SendIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {!hasConversation && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => applySuggestion(s.prompt)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-neutral-300 backdrop-blur-md transition-colors hover:border-white/25 hover:text-white"
              >
                <iconify-icon icon={s.icon} className="text-sm"></iconify-icon>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!hasConversation && (
        <GsapEntrance className="mt-8 flex justify-center">
          <TomorrowBriefing />
        </GsapEntrance>
      )}
    </div>
  );
}
