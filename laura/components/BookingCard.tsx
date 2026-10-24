"use client";

import { IconTile } from "@/components/IconTile";

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

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function BookingCard({
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
  return (
    <div className="gradient-border relative flex flex-col gap-3 rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <IconTile>
          <iconify-icon icon={CATEGORY_ICON[category] ?? CATEGORY_ICON.other} className="text-lg" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-sm font-medium text-neutral-100">{title}</h3>
            <button onClick={onDelete} className="shrink-0 text-xs text-neutral-500 hover:text-red-400">
              Delete
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
            {formatDateTime(dateTime) && <span>{formatDateTime(dateTime)}</span>}
            {partySize && <span>· {partySize} people</span>}
            {location && <span>· {location}</span>}
          </div>
          {note && <p className="mt-1.5 text-sm text-neutral-400">{note}</p>}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-neutral-300 underline underline-offset-2 hover:text-neutral-100"
            >
              Open booking link
              <iconify-icon icon="solar:arrow-right-up-linear" className="text-xs" />
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-neutral-800/60 pt-3">
        {Object.keys(STATUS_LABEL)
          .filter((s) => s !== "cancelled")
          .map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                status === s
                  ? "border-neutral-100 bg-neutral-100 text-neutral-950"
                  : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        {status !== "cancelled" && (
          <button
            onClick={() => onStatusChange("cancelled")}
            className="ml-auto font-mono text-[10px] uppercase tracking-wide text-neutral-600 hover:text-red-400"
          >
            cancel
          </button>
        )}
      </div>
    </div>
  );
}
