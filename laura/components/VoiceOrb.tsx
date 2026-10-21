"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { canSpeak, getSpeechRecognitionCtor, type SpeechRecognitionLike } from "@/lib/speech";
import { DustRing } from "@/components/DustRing";

export type OrbStatus = "idle" | "listening" | "thinking" | "speaking" | "unsupported";

export type VoiceOrbHandle = {
  /** Speaks the given text aloud, resolving once it finishes (or on error). */
  speak: (text: string) => Promise<void>;
};

const ARIA_LABEL: Record<OrbStatus, string> = {
  idle: "Tap to talk to Laura",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  unsupported: "Voice isn't supported in this browser — try Chrome or Edge",
};

const STATUS_LABEL: Record<OrbStatus, { line1?: string; line2: string }> = {
  idle: { line1: "tap to", line2: "talk" },
  listening: { line2: "listening…" },
  thinking: { line2: "thinking…" },
  speaking: { line2: "speaking…" },
  unsupported: { line1: "voice isn't supported —", line2: "try chrome or edge" },
};

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
      <path d="M8.5 21h7" />
    </svg>
  );
}

export const VoiceOrb = forwardRef<VoiceOrbHandle, { onTranscript: (text: string) => void }>(
  function VoiceOrb({ onTranscript }, ref) {
    const [status, setStatus] = useState<OrbStatus>("idle");
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const onTranscriptRef = useRef(onTranscript);

    useEffect(() => {
      onTranscriptRef.current = onTranscript;
    }, [onTranscript]);

    useEffect(() => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        setStatus("unsupported");
        return;
      }
      const recognition = new Ctor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setStatus("thinking");
          onTranscriptRef.current(transcript);
        }
      };
      recognition.onerror = () => setStatus("idle");
      recognition.onend = () =>
        setStatus((s) => (s === "listening" ? "idle" : s));
      recognitionRef.current = recognition;

      return () => {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      };
    }, []);

    useImperativeHandle(ref, () => ({
      speak: (text: string) =>
        new Promise((resolve) => {
          if (!canSpeak()) {
            resolve();
            return;
          }
          setStatus("speaking");
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => {
            setStatus("idle");
            resolve();
          };
          utterance.onerror = () => {
            setStatus("idle");
            resolve();
          };
          window.speechSynthesis.speak(utterance);
        }),
    }));

    function handleClick() {
      if (status === "unsupported" || status === "thinking" || status === "speaking") return;
      if (status === "idle") {
        setStatus("listening");
        recognitionRef.current?.start();
      } else if (status === "listening") {
        recognitionRef.current?.stop();
        setStatus("idle");
      }
    }

    const label = STATUS_LABEL[status];
    const ringColorClass =
      status === "listening"
        ? "border-amber-400/60 text-amber-300"
        : status === "thinking"
          ? "border-cyan-400/60 text-cyan-300"
          : status === "speaking"
            ? "border-amber-300/60 text-amber-200"
            : status === "unsupported"
              ? "border-neutral-700 text-neutral-600"
              : "border-neutral-500/60 text-neutral-300";

    return (
      <div className="flex flex-col items-center gap-5">
        <button
          onClick={handleClick}
          aria-label={ARIA_LABEL[status]}
          disabled={status === "unsupported"}
          className="group relative flex h-56 w-56 items-center justify-center outline-none disabled:cursor-not-allowed"
        >
          <DustRing status={status} size={224} />
          <span
            className="pointer-events-none absolute inset-2 rounded-full opacity-40 [animation:radar-sweep_6s_linear_infinite]"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(251,191,36,0.35) 345deg, transparent 360deg)",
            }}
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute inset-2 rounded-full border border-amber-500/10"
            aria-hidden="true"
          />
          <span
            className={`relative flex h-16 w-16 items-center justify-center rounded-full border bg-neutral-950/60 backdrop-blur-sm transition-colors duration-500 ${ringColorClass} ${
              status === "listening" ? "animate-[pulse_1.4s_ease-in-out_infinite]" : ""
            }`}
          >
            <MicIcon className="h-6 w-6" />
          </span>
        </button>
        <p className="flex flex-col items-center text-center text-xs tracking-wide text-neutral-500">
          {label.line1 && <span>{label.line1}</span>}
          <span className="font-medium text-neutral-300">{label.line2}</span>
        </p>
      </div>
    );
  }
);
