import type { ReactNode } from "react";

/** A small glass icon tile -- the same bg-neutral-900/40 + backdrop-blur
 * + hairline-border treatment as the portfolio cards, scaled down. */
export function IconTile({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-800/60 bg-neutral-900/40 text-neutral-300 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}
