"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "./GlassCard";
import { SPEECHES } from "@/lib/motivation";

export function MotivationalSpeech() {
  const [speech, setSpeech] = useState<string | null>(null);

  useEffect(() => {
    setSpeech(SPEECHES[Math.floor(Math.random() * SPEECHES.length)]);
  }, []);

  return (
    <GlassCard strong className="animate-fade-up p-6">
      <p className="text-balance text-lg font-medium leading-relaxed">
        {speech ?? " "}
      </p>
    </GlassCard>
  );
}
