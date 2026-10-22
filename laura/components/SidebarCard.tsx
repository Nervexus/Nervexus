import type { ReactNode } from "react";

/** A titled card used in each tool page's sidebar column. */
export function SidebarCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="gradient-border rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-4 backdrop-blur-sm">
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Chip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-neutral-800/60 bg-neutral-950/60 px-3.5 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:text-neutral-100"
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
