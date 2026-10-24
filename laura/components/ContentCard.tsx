"use client";

import { IconTile } from "@/components/IconTile";

const TYPE_ICON: Record<string, string> = {
  post: "solar:gallery-linear",
  reel: "solar:videocamera-linear",
  story: "solar:stop-circle-linear",
  other: "solar:bookmark-linear",
};

const STATUS_LABEL: Record<string, string> = {
  idea: "idea",
  scheduled: "scheduled",
  posted: "posted",
  discarded: "discarded",
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

export function ContentCard({
  title,
  type,
  status,
  caption,
  hashtags,
  location,
  outfit,
  scheduledAt,
  onStatusChange,
  onDelete,
}: {
  title: string;
  type: string;
  status: string;
  caption: string | null;
  hashtags: string | null;
  location: string | null;
  outfit: string | null;
  scheduledAt: string | null;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="gradient-border relative flex flex-col gap-3 rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <IconTile>
          <iconify-icon icon={TYPE_ICON[type] ?? TYPE_ICON.other} className="text-lg" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-sm font-medium text-neutral-100">{title}</h3>
            <button onClick={onDelete} className="shrink-0 text-xs text-neutral-500 hover:text-red-400">
              Delete
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
            {formatDateTime(scheduledAt) && <span>{formatDateTime(scheduledAt)}</span>}
            {location && <span>· {location}</span>}
            {outfit && <span>· {outfit}</span>}
          </div>
          {caption && <p className="mt-1.5 whitespace-pre-wrap text-sm text-neutral-400">{caption}</p>}
          {hashtags && (
            <p className="mt-1.5 text-xs text-neutral-600">
              {hashtags
                .split(",")
                .map((h) => h.trim())
                .filter(Boolean)
                .map((h) => `#${h}`)
                .join(" ")}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-neutral-800/60 pt-3">
        {Object.keys(STATUS_LABEL)
          .filter((s) => s !== "discarded")
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
        {status !== "discarded" && (
          <button
            onClick={() => onStatusChange("discarded")}
            className="ml-auto font-mono text-[10px] uppercase tracking-wide text-neutral-600 hover:text-red-400"
          >
            discard
          </button>
        )}
      </div>
    </div>
  );
}
