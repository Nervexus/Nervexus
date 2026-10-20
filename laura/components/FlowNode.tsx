import type { ReactNode } from "react";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";

/** A node card in the workflow-style diagram, e.g. "Notes" or "Vault". */
export function FlowNode({
  icon,
  title,
  subtitle,
  active = true,
  href,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  active?: boolean;
  href?: string;
}) {
  const content = (
    <div
      className={`relative flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-colors ${
        active
          ? "border-emerald-500/30 bg-neutral-900/80 hover:border-emerald-500/60"
          : "border-neutral-800 bg-neutral-900/40 opacity-60"
      }`}
    >
      {active && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-neutral-950">
          <CheckIcon className="h-2.5 w-2.5" />
        </span>
      )}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-neutral-800 text-emerald-300" : "bg-neutral-800/60 text-neutral-500"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-neutral-100">{title}</div>
        {subtitle && <div className="truncate text-[11px] text-neutral-500">{subtitle}</div>}
      </div>
    </div>
  );

  if (href && active) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
