import type { ReactNode } from "react";

/** A titled card used in each tool page's sidebar column. */
export function SidebarCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Chip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-neutral-800 bg-neutral-950/60 px-3.5 py-1.5 text-xs text-neutral-300 transition-colors hover:border-amber-500/40 hover:text-amber-300"
    >
      {children}
    </button>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className="font-mono text-sm text-neutral-200">{value}</span>
    </div>
  );
}
