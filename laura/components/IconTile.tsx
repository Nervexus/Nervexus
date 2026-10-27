import type { ReactNode } from "react";

/** 38px purple-tinted icon tile used in list items and empty states. */
export function IconTile({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`icon-tile ${className}`}>{children}</div>;
}
