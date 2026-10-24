"use client";

import { IconTile } from "@/components/IconTile";

const STATUS_LABEL: Record<string, string> = {
  connected: "connected",
  expiring: "expires soon",
  missing: "not set",
};

export function SettingsCard({
  icon,
  label,
  detail,
  status,
}: {
  icon: string;
  label: string;
  detail: string | null;
  status: "connected" | "expiring" | "missing";
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#1b1b1d] p-4">
      <IconTile>
        <iconify-icon icon={icon} className="text-lg" />
      </IconTile>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-neutral-100">{label}</h3>
        {detail && <p className="mt-0.5 truncate text-xs text-neutral-500">{detail}</p>}
      </div>
      <span
        className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${
          status === "connected"
            ? "border-neutral-700 text-neutral-300"
            : status === "expiring"
              ? "border-red-900/60 text-red-400"
              : "border-neutral-800 text-neutral-600"
        }`}
      >
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}
