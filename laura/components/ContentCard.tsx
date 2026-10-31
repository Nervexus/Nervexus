"use client";

import { useState } from "react";

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
  return new Date(iso).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** One content idea as a flat row; tap it for the caption, hashtags and status. */
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
  const [open, setOpen] = useState(false);
  const meta = [formatDateTime(scheduledAt), location, outfit].filter(Boolean).join(" · ") || type;
  const tags = hashtags
    ?.split(",")
    .map((h) => h.trim())
    .filter(Boolean)
    .map((h) => `#${h}`)
    .join(" ");

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="row is-link w-full text-left">
        <span className="row-icon">
          <iconify-icon icon={TYPE_ICON[type] ?? TYPE_ICON.other} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[14px] ${status === "discarded" ? "text-dim line-through" : "text-text"}`}>{title}</span>
          <span className="mt-0.5 block truncate text-[12px] capitalize text-muted">{meta}</span>
        </span>
        <span className={`tag shrink-0 capitalize ${status === "scheduled" ? "tag-purple" : ""}`}>{STATUS_LABEL[status] ?? status}</span>
      </button>

      {open && (
        <div className="px-5 pb-4 pl-[64px]">
          {caption && <p className="whitespace-pre-wrap text-[13px] text-muted">{caption}</p>}
          {tags && <p className="mt-1.5 text-[12px] text-neutral-600">{tags}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {Object.keys(STATUS_LABEL)
              .filter((s) => s !== "discarded")
              .map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`tag capitalize transition-opacity ${status === s ? "tag-purple" : "opacity-60 hover:opacity-100"}`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            <span className="ml-auto flex items-center gap-1">
              {status !== "discarded" && (
                <button onClick={() => onStatusChange("discarded")} className="btn-ghost !px-2 !py-1 !text-[12px] hover:!text-red-400">
                  Discard
                </button>
              )}
              <button onClick={onDelete} className="btn-ghost !px-2 !py-1 !text-[12px] hover:!text-red-400">
                Delete
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
