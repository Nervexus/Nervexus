import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
  strong = false,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`${strong ? "glass-strong" : "glass"} rounded-3xl ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-foreground/90 ${className}`}
    >
      {children}
    </span>
  );
}
