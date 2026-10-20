import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";

/** A node card in the workflow-style diagram, e.g. "Notes" or "Vault". */
export function FlowNode({
  icon,
  title,
  subtitle,
  active = true,
  href,
  pulsing = false,
  style,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  active?: boolean;
  href?: string;
  /** Briefly highlighted right after Laura actually used this tool. */
  pulsing?: boolean;
  style?: CSSProperties;
}) {
  const content = (
    <div
      style={style}
      className={`relative flex animate-[rise-in_0.5s_ease-out_backwards] items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-all duration-500 ${
        pulsing
          ? "scale-[1.04] border-emerald-400 bg-emerald-500/10 shadow-[0_0_24px_4px_rgba(52,211,153,0.35)]"
          : active
            ? "border-emerald-500/30 bg-neutral-900/80 hover:border-emerald-500/60 hover:bg-neutral-900"
            : "border-neutral-800 bg-neutral-900/40 opacity-60"
      }`}
    >
      {active && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-neutral-950">
          <CheckIcon className="h-2.5 w-2.5" />
        </span>
      )}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-500 ${
          pulsing
            ? "bg-emerald-500/20 text-emerald-200"
            : active
              ? "bg-neutral-800 text-emerald-300"
              : "bg-neutral-800/60 text-neutral-500"
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
