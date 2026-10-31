"use client";

import { useId, useState, type ReactNode } from "react";

/* The minimal page system: a short header, the page's one main thing, and
   everything secondary folded into Sections inside a single Group card.
   Lists are flat Rows divided by hairlines, never a card per row. */

export function PageHeader({ title, meta, sub, actions }: { title: string; meta?: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="page-title">{title}</h1>
          {meta}
        </div>
        {sub && <p className="mt-1 text-[13px] text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/** One card holding several Sections or Rows, divided by hairlines. */
export function Group({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      {title && <h2 className="group-title">{title}</h2>}
      <div className="card group-list">{children}</div>
    </section>
  );
}

/** A collapsible row: header with title, short summary and chevron; content folds out below. */
export function Section({
  title,
  summary,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: ReactNode;
  icon?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="section" data-open={open || undefined}>
      <button type="button" className="section-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {icon && <iconify-icon icon={icon} className="section-icon" />}
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[14px] font-medium text-text">{title}</span>
        </span>
        {summary !== undefined && <span className="section-summary">{summary}</span>}
        <svg viewBox="0 0 24 24" className="section-chevron" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
      <div id={id} className="section-body" role="region">
        <div className="section-inner">
          <div className="section-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** A flat list row: optional leading icon, title + sub, trailing content. */
export function Row({
  icon,
  title,
  sub,
  trailing,
  onClick,
  href,
  className = "",
}: {
  icon?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      {icon && <span className="row-icon">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] text-text">{title}</span>
        {sub && <span className="mt-0.5 block truncate text-[12px] text-muted">{sub}</span>}
      </span>
      {trailing && <span className="flex shrink-0 items-center gap-2">{trailing}</span>}
    </>
  );
  if (href) {
    return (
      <a href={href} className={`row is-link ${className}`}>
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`row is-link w-full text-left ${className}`}>
        {body}
      </button>
    );
  }
  return <div className={`row ${className}`}>{body}</div>;
}

/** Quiet empty line inside a Group, instead of a big empty-state card. */
export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-6 text-center text-[13px] text-muted">{children}</p>;
}
