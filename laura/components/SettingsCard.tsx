"use client";

import { Row } from "@/components/ui/layout";

const STATUS_LABEL: Record<string, string> = {
  connected: "connected",
  expiring: "expires soon",
  missing: "not set",
};

/** One connection's status as a flat row inside a settings Group. */
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
    <Row
      icon={<iconify-icon icon={icon} />}
      title={label}
      sub={detail ?? undefined}
      trailing={
        <span className={`tag ${status === "connected" ? "!border-green/20 !bg-green-soft !text-green" : status === "expiring" ? "tag-red" : ""}`}>
          {STATUS_LABEL[status]}
        </span>
      }
    />
  );
}
