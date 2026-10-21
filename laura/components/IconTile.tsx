import type { ReactNode } from "react";
import { notch } from "@/lib/clip";

/** A small notched-corner icon tile — the same brand motif as the primary
 * button, scaled down for use inside Reminder/Vault cards. */
export function IconTile({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      style={{ clipPath: notch(7) }}
      className={`flex h-10 w-10 shrink-0 items-center justify-center bg-neutral-800 text-amber-300/90 ${className}`}
    >
      {children}
    </div>
  );
}
