"use client";

import { forwardRef } from "react";
import { VoiceOrb, type VoiceOrbHandle } from "@/components/VoiceOrb";

function ChatBubbleIcon({ className }: { className?: string }) {
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
      <path d="M4 5h16v11H9l-5 4V5Z" />
    </svg>
  );
}

export const FlowDiagram = forwardRef<VoiceOrbHandle, { onTranscript: (text: string) => void }>(
  function FlowDiagram({ onTranscript }, orbRef) {
    return (
      <div className="flex w-full flex-col items-center">
        <div className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-neutral-300">
          <ChatBubbleIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
          You
        </div>

        <div className="h-6 w-px bg-neutral-700 sm:h-8" />

        <VoiceOrb ref={orbRef} onTranscript={onTranscript} />
      </div>
    );
  }
);
