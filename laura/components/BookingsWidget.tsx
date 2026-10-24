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
    <div className="rounded-3xl bg-gradient-to-b from-[#19191b] to-[#121213] shadow-[0_20px_50px_-25px_rgba(0,0,0,0.9)] p-5">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <span className="text-5xl font-thin tabular-nums tracking-tight text-neutral-100">
            {String(count).padStart(2, "0")}
          </span>
          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">{label}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-1.5">{children}</div>
    </div>
  );
}
