"use client";

import { useState } from "react";
import { IconTile } from "@/components/IconTile";
import { Button } from "@/components/Button";

function formatRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const dateLabel = start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const startLabel = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const endLabel = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${dateLabel} · ${startLabel} – ${endLabel}`;
}

export function ShiftCard({
  id,
  startAt,
  endAt,
  location,
  colleagues,
  note,
  source,
  commutePlan,
  onDelete,
}: {
  id: string;
  startAt: string;
  endAt: string;
  location: string | null;
  colleagues: string | null;
  note: string | null;
  source: string;
  commutePlan: string | null;
  onDelete: () => void;
}) {
  const [plan, setPlan] = useState(commutePlan);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function planCommute() {
    setPlanning(true);
    setError(null);
    try {
      const res = await fetch(`/api/rota/${id}/commute`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't plan the commute.");
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't plan the commute.");
    } finally {
      setPlanning(false);
    }
  }

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl bg-[#1b1b1d] p-4">
      <div className="flex items-start gap-3">
        <IconTile>
          <iconify-icon icon="solar:calendar-linear" className="text-lg" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium text-neutral-100">{formatRange(startAt, endAt)}</h3>
            <button onClick={onDelete} className="shrink-0 text-xs text-neutral-500 hover:text-red-400">
              Delete
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
            {location && <span>{location}</span>}
            {colleagues && <span>· with {colleagues}</span>}
            {source === "photo" && (
              <span className="rounded-full border border-neutral-800 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-neutral-600">
                from photo
              </span>
            )}
          </div>
          {note && <p className="mt-1.5 text-sm text-neutral-400">{note}</p>}
        </div>
      </div>

      {plan ? (
        <div className="rounded-xl bg-neutral-900/70 px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">Commute plan</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-300">{plan}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={planCommute} disabled={planning}>
            {planning ? "Planning…" : "Plan commute"}
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
