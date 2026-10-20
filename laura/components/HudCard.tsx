import type { ReactNode } from "react";

/**
 * Dark, instrument-panel-style card: hairline border, faint corner ticks,
 * and a soft inner vignette. The shared container for Notes/Reminders/
 * Vault list items and the home page's overview tiles.
 */
export function HudCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] transition-colors hover:border-neutral-700 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.04),transparent_60%)]" />
      {["left-2 top-2", "right-2 top-2", "left-2 bottom-2", "right-2 bottom-2"].map((pos) => (
        <span
          key={pos}
          className={`pointer-events-none absolute h-1.5 w-1.5 border-neutral-700 opacity-60 ${pos} ${
            pos.includes("left") ? "border-l" : "border-r"
          } ${pos.includes("top") ? "border-t" : "border-b"}`}
        />
      ))}
      <div className="relative">{children}</div>
    </div>
  );
}

/** Hexagonal icon badge, the "node" motif from the reference moodboard. */
export function HexBadge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center bg-gradient-to-b from-neutral-700 to-neutral-800 text-neutral-300 ${className}`}
      style={{ clipPath: "polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)" }}
    >
      <div
        className="flex h-full w-full scale-[0.82] items-center justify-center bg-neutral-900/80"
        style={{ clipPath: "polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)" }}
      >
        {children}
      </div>
    </div>
  );
}
