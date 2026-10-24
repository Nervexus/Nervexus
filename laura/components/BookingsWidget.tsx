import type { ReactNode } from "react";

/** The "smart device panel" card every Bookings section lives in -- a big
 * monospace count up top (like a clock readout), a small dotted texture
 * swatch for flavor, and whatever rows the page passes in below. */
export function BookingsWidget({
  count,
  label,
  children,
}: {
  count: number;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-neutral-900 bg-neutral-950 p-5">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <span className="font-mono text-4xl tabular-nums tracking-tight text-neutral-100">
            {String(count).padStart(2, "0")}
          </span>
          <span className="ml-2 font-mono text-xs uppercase tracking-widest text-neutral-500">{label}</span>
        </div>
        <div className="widget-dots h-7 w-7 shrink-0 rounded-md bg-neutral-900" />
      </div>
      <div className="mt-4 flex flex-col gap-1.5">{children}</div>
    </div>
  );
}
