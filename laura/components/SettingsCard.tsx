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
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
      <IconTile>
        <iconify-icon icon={icon} className="text-lg" />
      </IconTile>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-neutral-800">{label}</h3>
        {detail && <p className="mt-0.5 truncate text-xs text-neutral-500">{detail}</p>}
      </div>
      <span
        className={`tag shrink-0 ${status === "connected" ? "tag-purple" : status === "expiring" ? "tag-red" : ""}`}
      >
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}
