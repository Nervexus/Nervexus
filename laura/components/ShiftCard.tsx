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

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  onUpdated,
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
  onUpdated?: () => void;
}) {
  const [plan, setPlan] = useState(commutePlan);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editStart, setEditStart] = useState(toLocalInputValue(startAt));
  const [editEnd, setEditEnd] = useState(toLocalInputValue(endAt));
  const [editLocation, setEditLocation] = useState(location ?? "");
  const [editColleagues, setEditColleagues] = useState(colleagues ?? "");
  const [editNote, setEditNote] = useState(note ?? "");

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

  function openEdit() {
    setEditStart(toLocalInputValue(startAt));
    setEditEnd(toLocalInputValue(endAt));
    setEditLocation(location ?? "");
    setEditColleagues(colleagues ?? "");
    setEditNote(note ?? "");
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rota/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startAt: new Date(editStart).toISOString(),
          endAt: new Date(editEnd).toISOString(),
          location: editLocation || null,
          colleagues: editColleagues || null,
          note: editNote || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't update the shift.");
      setEditing(false);
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the shift.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="relative flex flex-col gap-3 rounded-2xl bg-white p-4">
        <span className="label">Edit shift</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="datetime-local"
            value={editStart}
            onChange={(e) => setEditStart(e.target.value)}
            className="input text-xs"
          />
          <input
            type="datetime-local"
            value={editEnd}
            onChange={(e) => setEditEnd(e.target.value)}
            className="input text-xs"
          />
          <input
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            placeholder="Location"
            className="input text-xs placeholder:text-neutral-400"
          />
          <input
            value={editColleagues}
            onChange={(e) => setEditColleagues(e.target.value)}
            placeholder="Colleagues"
            className="input text-xs placeholder:text-neutral-400"
          />
        </div>
        <input
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          placeholder="Note"
          className="input text-xs placeholder:text-neutral-400"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          <Button variant="accent" onClick={saveEdit} disabled={saving || !editStart || !editEnd}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl bg-white p-4">
      <div className="flex items-start gap-3">
        <IconTile>
          <iconify-icon icon="solar:calendar-linear" className="text-lg" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium text-neutral-800">{formatRange(startAt, endAt)}</h3>
            <div className="flex shrink-0 gap-2">
              <button onClick={openEdit} className="text-xs text-neutral-500 hover:text-neutral-800">
                Edit
              </button>
              <button onClick={onDelete} className="text-xs text-neutral-500 hover:text-red-400">
                Delete
              </button>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
            {location && <span>{location}</span>}
            {colleagues && <span>· with {colleagues}</span>}
            {source === "photo" && (
              <span className="tag">
                from photo
              </span>
            )}
          </div>
          {note && <p className="mt-1.5 text-sm text-neutral-400">{note}</p>}
        </div>
      </div>

      {plan ? (
        <div className="item px-3 py-2.5">
          <p className="label">Commute plan</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{plan}</p>
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
