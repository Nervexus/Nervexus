import type { ReactNode } from "react";

/** A titled card used in each tool page's sidebar column. */
export function SidebarCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-neutral-900 bg-neutral-950 p-5">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-500">{title}</h2>
        <div className="widget-dots h-6 w-6 shrink-0 rounded-md bg-neutral-900" />
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function Chip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-neutral-900/70 px-3.5 py-2 font-mono text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:text-neutral-100"
    >
      {children}
    </button>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-neutral-900/60 px-3 py-2.5">
      <span className="text-sm text-neutral-300">{label}</span>
      <span className="font-mono text-xs tabular-nums text-neutral-500">{value}</span>
    </div>
  );
}
