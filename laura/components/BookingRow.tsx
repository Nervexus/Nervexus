"use client";

import { useState } from "react";
import { readyToBookLinks } from "@/lib/booking-links";

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

function formatWhen(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** One booking as a flat row; tap it to show status, booking links and delete. */
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
  const [open, setOpen] = useState(false);
  const active = status === "confirmed" || status === "pending";
  const meta = [formatWhen(dateTime), location, partySize ? `${partySize} people` : null].filter(Boolean).join(" · ");

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="row is-link w-full text-left">
        <span className="row-icon">
          <iconify-icon icon={CATEGORY_ICON[category] ?? CATEGORY_ICON.other} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[14px] ${status === "cancelled" ? "text-dim line-through" : "text-text"}`}>{title}</span>
          {meta && <span className="mt-0.5 block truncate text-[12px] text-muted">{meta}</span>}
        </span>
        <span className={`tag shrink-0 capitalize ${active ? "tag-purple" : ""}`}>{STATUS_LABEL[status] ?? status}</span>
      </button>

      {open && (
        <div className="px-5 pb-4 pl-[64px]">
          {note && <p className="mb-3 whitespace-pre-wrap text-[13px] text-muted">{note}</p>}
          <div className="flex flex-wrap items-center gap-1.5">
            {Object.keys(STATUS_LABEL)
              .filter((s) => s !== "cancelled")
              .map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`tag whitespace-nowrap capitalize transition-opacity ${status === s ? "tag-purple" : "opacity-60 hover:opacity-100"}`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {status !== "cancelled" &&
              readyToBookLinks({
                title,
                category,
                location,
                link,
                partySize,
                dateTime: dateTime ? new Date(dateTime) : null,
              }).map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="btn-ghost whitespace-nowrap !px-2 !py-1 !text-[12px]">
                  {l.label} ↗
                </a>
              ))}
            <span className="ml-auto flex items-center gap-1">
              {status !== "cancelled" && (
                <button onClick={() => onStatusChange("cancelled")} className="btn-ghost !px-2 !py-1 !text-[12px] hover:!text-red-400">
                  Cancel
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
