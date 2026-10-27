import type { ReactNode } from "react";

/** Small hairline pill with a status dot -- page-header counts, statuses. */
export function Pill({ children, className = "", dotId, live = false }: { children: ReactNode; className?: string; dotId?: string; live?: boolean }) {
  return (
    <span className={`pill ${className}`}>
      <span id={dotId} className={`dot ${live ? "is-live" : ""}`} />
      <span className="font-mono tabular">{children}</span>
    </span>
  );
}
