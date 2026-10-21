import type { ReactNode } from "react";

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-neutral-300 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      {children}
    </span>
  );
}
