import type { ReactNode } from "react";

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full border border-amber-500/30 px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-amber-400/90 ${className}`}
    >
      {children}
    </span>
  );
}
