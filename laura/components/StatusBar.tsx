"use client";

import { useEffect, useState } from "react";

/** A Batcomputer-style live clock + system status readout. */
export function StatusBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border-b border-neutral-800 px-5 py-3 font-mono text-[11px] text-neutral-600">
      <div className="flex items-center gap-1.5 text-amber-500/80">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        <span className="tracking-wide">SYSTEMS NOMINAL</span>
      </div>
      <div className="mt-1 tabular-nums">
        {now
          ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          : "--:--:--"}
        {now && (
          <span className="text-neutral-700">
            {" "}
            · {now.toLocaleDateString([], { month: "short", day: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}
