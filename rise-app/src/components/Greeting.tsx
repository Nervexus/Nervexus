"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { HARSH_LINES, timeOfDayGreeting } from "@/lib/greeting";

const HARSH_CHANCE = 0.25;

export function Greeting() {
  const [name] = useLocalStorage<string>("profile:name", "");
  const [mode, setMode] = useState<{ harsh: boolean; line: string } | null>(
    null
  );

  // Rolled once on mount so the name (which loads a beat later from
  // storage) can't flip the chosen line out from under the user.
  useEffect(() => {
    if (Math.random() < HARSH_CHANCE) {
      setMode({
        harsh: true,
        line: HARSH_LINES[Math.floor(Math.random() * HARSH_LINES.length)],
      });
    } else {
      setMode({ harsh: false, line: timeOfDayGreeting(new Date().getHours()) });
    }
  }, []);

  const text = !mode
    ? " "
    : mode.harsh
    ? mode.line
    : name.trim()
    ? `${mode.line}, ${name.trim()}`
    : `${mode.line}.`;

  return (
    <h1 className="text-balance mt-2 text-[34px] font-semibold leading-tight tracking-tight text-foreground-page">
      {text}
    </h1>
  );
}
