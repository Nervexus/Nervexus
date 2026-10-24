import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";

/** A node card in the workflow-style diagram, e.g. "Notes" or "Vault".
 * Icon-above-text (not icon-beside-text) on purpose: a side-by-side
 * layout's minimum content width is icon + gap + the widest text line,
 * which stopped fitting once there were 8 of these in one row (each
 * squeezed to ~100px forced severe truncation or overflowed the row
 * entirely, since a flex item's default min-width is its own content
 * size). Stacking the text under the icon needs only as much width as
 * the text itself, which scales to far more nodes per row. */
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
      className={`relative flex animate-[rise-in_0.5s_ease-out_backwards] flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center backdrop-blur-sm transition-all duration-500 ${
        pulsing
          ? "scale-[1.04] border-neutral-100 bg-neutral-100/10 shadow-[0_0_24px_4px_rgba(245,245,245,0.25)]"
          : active
            ? "border-neutral-800/60 bg-neutral-900/40 hover:border-neutral-600"
            : "border-neutral-800/60 bg-neutral-900/20 opacity-60"
      }`}
    >
      {active && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-100 text-neutral-950">
          <CheckIcon className="h-2.5 w-2.5" />
        </span>
      )}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-500 ${
          pulsing
            ? "bg-neutral-100/20 text-neutral-100"
            : active
              ? "bg-neutral-800 text-neutral-300"
              : "bg-neutral-800/60 text-neutral-500"
        }`}
      >
        {icon}
      </div>
      <div className="w-full min-w-0">
        <div className="truncate text-xs font-medium text-neutral-100">{title}</div>
        {subtitle && <div className="truncate text-[10px] text-neutral-500">{subtitle}</div>}
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
