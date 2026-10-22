import type { ReactNode } from "react";

/** The "Available for projects"-style badge: a hairline pill with a
 * pulsing dot, used for both the hero status and page-header counts. */
export function Pill({
  children,
  className = "",
  dotId,
}: {
  children: ReactNode;
  className?: string;
  /** Only the Home hero badge needs a stable id (the GSAP pulse targets
   * #pulse-dot specifically there); every other Pill animates via the
   * shared .pulse-dot class so duplicate ids never collide. */
  dotId?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-full border border-neutral-800/60 bg-neutral-900/40 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-neutral-400 backdrop-blur-sm ${className}`}
    >
      <span id={dotId} className="pulse-dot h-1.5 w-1.5 rounded-full bg-neutral-200" />
      {children}
    </span>
  );
}
