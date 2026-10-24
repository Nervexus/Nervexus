"use client";

const CATEGORY_ICON: Record<string, string> = {
  restaurant: "solar:chef-hat-linear",
  activity: "solar:ticket-linear",
  travel: "solar:map-point-linear",
  other: "solar:bookmark-linear",
};

const STATUS_LABEL: Record<string, string> = {
  idea: "idea",
  pending: "pending",
  confirmed: "confirmed",
  cancelled: "cancelled",
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** One booking, styled as its own small device panel (dotted texture,
 * rounded-2xl, monospace meta) rather than a row you have to expand --
 * everything about it is visible at a glance. */
export function BookingRow({
  title,
  category,
  status,
  dateTime,
  partySize,
  location,
  link,
  note,
  onStatusChange,
  onDelete,
}: {
  title: string;
  category: string;
  status: string;
  dateTime: string | null;
  partySize: number | null;
  location: string | null;
  link: string | null;
  note: string | null;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}) {
  // Confirmed/pending are the ones actually happening soon -- idea and
  // cancelled stay the quiet neutral tick, same "one accent for what
  // matters" rule as the rest of this page.
  const active = status === "confirmed" || status === "pending";
  const meta = [location, partySize ? `${partySize} people` : null].filter(Boolean).join(" · ");

  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-900/50 p-4">
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 h-8 w-[3px] shrink-0 rounded-full ${
            status === "cancelled" ? "bg-neutral-800" : active ? "bg-[var(--booking-accent)]" : "bg-neutral-700"
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <iconify-icon
                icon={CATEGORY_ICON[category] ?? CATEGORY_ICON.other}
                className="shrink-0 text-sm text-neutral-500"
              ></iconify-icon>
              <h3 className={`text-sm font-medium ${status === "cancelled" ? "text-neutral-600 line-through" : "text-neutral-100"}`}>
                {title}
              </h3>
            </div>
            <div className="widget-dots h-5 w-5 shrink-0 rounded bg-neutral-900" />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs tabular-nums text-neutral-500">
            <span>{formatWhen(dateTime)}</span>
            {meta && <span>· {meta}</span>}
          </div>
          {note && <p className="mt-2 text-sm text-neutral-400">{note}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-neutral-800/60 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {Object.keys(STATUS_LABEL)
                .filter((s) => s !== "cancelled")
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => onStatusChange(s)}
                    className={`whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                      status === s
                        ? "border-[var(--booking-accent)] bg-[var(--booking-accent)] text-neutral-950"
                        : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
            </div>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wide text-neutral-400 hover:text-neutral-100"
              >
                Open link
              </a>
            )}
            <div className="ml-auto flex items-center gap-3">
              {status !== "cancelled" && (
                <button
                  onClick={() => onStatusChange("cancelled")}
                  className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wide text-neutral-600 hover:text-red-400"
                >
                  cancel
                </button>
              )}
              <button
                onClick={onDelete}
                className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wide text-neutral-600 hover:text-red-400"
              >
                delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
