"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { canSpeak, getSpeechRecognitionCtor, type SpeechRecognitionLike } from "@/lib/speech";

export type OrbStatus = "idle" | "listening" | "thinking" | "speaking" | "unsupported";

export type VoiceOrbHandle = {
  /** Speaks the given text aloud, resolving once it finishes (or on error). */
  speak: (text: string) => Promise<void>;
};

const STATUS_LABEL: Record<OrbStatus, string> = {
  idle: "Tap to talk to Laura",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  unsupported: "Voice isn't supported in this browser — try Chrome or Edge",
};

export const VoiceOrb = forwardRef<VoiceOrbHandle, { onTranscript: (text: string) => void }>(
  function VoiceOrb({ onTranscript }, ref) {
    const [status, setStatus] = useState<OrbStatus>("idle");
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const onTranscriptRef = useRef(onTranscript);
    onTranscriptRef.current = onTranscript;

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

    return (
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleClick}
          aria-label={STATUS_LABEL[status]}
          disabled={status === "unsupported"}
          className="group relative flex h-44 w-44 items-center justify-center rounded-full outline-none disabled:cursor-not-allowed"
        >
          <span
            className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${
              status === "idle"
                ? "bg-amber-500/20"
                : status === "listening"
                  ? "scale-110 bg-amber-400/50"
                  : status === "thinking"
                    ? "bg-violet-400/40"
                    : status === "speaking"
                      ? "bg-amber-300/50"
                      : "bg-neutral-700/20"
            }`}
          />
          <span
            className={`absolute inset-3 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-violet-500 opacity-90 ${
              status === "listening"
                ? "animate-[pulse_1.1s_ease-in-out_infinite]"
                : status === "thinking"
                  ? "animate-[spin_2.2s_linear_infinite]"
                  : status === "speaking"
                    ? "animate-[pulse_0.6s_ease-in-out_infinite]"
                    : "animate-[pulse_3.5s_ease-in-out_infinite]"
            } ${status === "unsupported" ? "opacity-30 grayscale" : ""}`}
          />
          <span className="absolute inset-3 rounded-full bg-neutral-950/10 mix-blend-overlay" />
          <span className="relative h-5 w-5 rounded-full bg-white/90 shadow-[0_0_20px_6px_rgba(255,255,255,0.5)]" />
        </button>
        <p className="text-xs tracking-wide text-neutral-500">{STATUS_LABEL[status]}</p>
      </div>
    );
  }
);
