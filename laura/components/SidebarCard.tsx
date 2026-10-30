import type { ReactNode } from "react";

/** A titled card used in each tool page's side column. */
export function SidebarCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card card-pad">
      <h2 className="label">{title}</h2>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

export function Chip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="item px-3.5 py-2 text-[13px] text-muted transition-colors hover:text-text">
      {children}
    </button>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="item flex items-center justify-between px-3.5 py-2.5">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="font-mono text-[13px] font-medium tabular text-text">{value}</span>
    </div>
  );
}
