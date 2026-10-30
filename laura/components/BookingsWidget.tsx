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
    <div className="card p-5">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <span className="stat-num !text-[46px]">
            {String(count).padStart(2, "0")}
          </span>
          <span className="label ml-2">{label}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-1.5">{children}</div>
    </div>
  );
}
