"use client";

import { useEffect, useRef, useState } from "react";
import { type VoiceOrbHandle } from "@/components/VoiceOrb";
import { DotGrid } from "@/components/DotGrid";
import { FlowDiagram } from "@/components/FlowDiagram";

type Message = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    setMessages((prev) => [...prev, { role: "user", content: text }]);
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
      setMessages((prev) => [...prev, { role: "assistant", content: body.reply }]);
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
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              online
            </span>
          </div>

          <FlowDiagram ref={orbRef} onTranscript={(text) => sendMessage(text, true)} />
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {!loaded && <p className="text-sm text-neutral-600">Loading…</p>}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "self-end bg-neutral-100 text-neutral-900"
                  : "self-start bg-neutral-900 text-neutral-100"
              }`}
            >
              {m.content}
            </div>
          ))}
          {sending && (
            <div className="self-start rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm text-neutral-500">
              …
            </div>
          )}
          {error && (
            <div className="self-start rounded-2xl bg-red-950 px-4 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>

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
