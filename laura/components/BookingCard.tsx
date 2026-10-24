"use client";

import { useState } from "react";
import { HolographicShader } from "@/components/HolographicShader";

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

// Confirmed reads brightest, idea dimmest -- cancelled is the one red
// accent, same "red means destructive/cancelled" rule as the rest of the
// app. Everything else about this card's chrome stays neutral; the only
// other color is the holographic shader itself, by design.
const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-neutral-100",
  pending: "bg-neutral-300",
  idea: "bg-neutral-600",
  cancelled: "bg-red-400",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
  const [hover, setHover] = useState(false);
  const descriptor = [category, location].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto flex w-full max-w-[360px] flex-col gap-3">
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-neutral-800/60 bg-[#070707]"
        style={{ containerType: "inline-size" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <HolographicShader glow={hover} className="absolute inset-0 block h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40 mix-blend-multiply" />
        <div
          className="noise-overlay pointer-events-none absolute inset-0 opacity-20"
          style={{ filter: "contrast(150%) brightness(100%)" }}
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-[8cqw] text-white">
          <div className="flex items-center justify-between gap-2 text-[3.1cqw] font-medium uppercase tracking-[0.2em] text-neutral-400">
            <span className="flex items-center gap-[1.6cqw]">
              <iconify-icon icon={CATEGORY_ICON[category] ?? CATEGORY_ICON.other}></iconify-icon>
              {category}
            </span>
            <span className="flex items-center gap-[1.3cqw]">
              <span className={`h-[1.6cqw] w-[1.6cqw] rounded-full ${STATUS_DOT[status] ?? STATUS_DOT.idea}`} />
              {STATUS_LABEL[status] ?? status}
            </span>
          </div>

          <div className="w-full">
            <div className="flex items-end justify-between gap-[3cqw]">
              <h3 className="line-clamp-2 text-[7cqw] font-semibold leading-tight tracking-tight text-white drop-shadow-lg">
                {title}
              </h3>
              <iconify-icon
                icon={link ? "solar:arrow-right-up-linear" : (CATEGORY_ICON[category] ?? CATEGORY_ICON.other)}
                className="shrink-0 text-[6cqw] text-[color:var(--booking-accent)]"
              ></iconify-icon>
            </div>
            <div className="my-[3cqw] h-px w-full bg-gradient-to-r from-neutral-500/50 to-transparent" />
            <p className="truncate text-[2.8cqw] font-medium uppercase tracking-[0.2em] text-neutral-400">
              {descriptor || "No location yet"}
            </p>
          </div>

          <div className="flex gap-[4cqw]">
            <div className="min-w-0 flex-1">
              <span className="block truncate text-[4.6cqw] font-semibold text-white">{formatDate(dateTime)}</span>
              <span className="mt-[0.6cqw] block text-[2.3cqw] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Date
              </span>
            </div>
            <div className="min-w-0 flex-1 border-x border-white/5 px-[4cqw]">
              <span className="block truncate text-[4.6cqw] font-semibold text-white">{formatTime(dateTime)}</span>
              <span className="mt-[0.6cqw] block text-[2.3cqw] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Time
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-[4.6cqw] font-semibold text-white">{partySize ?? "—"}</span>
              <span className="mt-[0.6cqw] block text-[2.3cqw] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Guests
              </span>
            </div>
          </div>
        </div>
      </div>

      {note && <p className="px-0.5 text-sm text-neutral-400">{note}</p>}

      <div className="gradient-border relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-neutral-800/60 bg-neutral-900/40 px-3 py-2.5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.keys(STATUS_LABEL)
            .filter((s) => s !== "cancelled")
            .map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${
                  status === s
                    ? "border-neutral-100 bg-neutral-100 text-neutral-950"
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
  );
}
