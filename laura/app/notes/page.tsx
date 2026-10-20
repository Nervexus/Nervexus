"use client";

import { useEffect, useState } from "react";
import { DotGrid } from "@/components/DotGrid";
import { NoteCard, PortDot } from "@/components/NoteCard";

type Note = { id: string; title: string; body: string; updatedAt: string };

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => setNotes(data.notes ?? []))
      .catch(() => setError("Couldn't load notes."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  function startEdit(note: Note) {
    setEditingId(note.id);
    setTitle(note.title);
    setBody(note.body);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setBody("");
  }

  async function save() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setError(null);

    try {
      const res = await fetch(editingId ? `/api/notes/${editingId}` : "/api/notes", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save note.");
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save note.");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    load();
  }

  const lastUpdated = notes[0]?.updatedAt;

  return (
    <div className="relative flex-1">
      <div className="relative overflow-hidden border-b border-neutral-800 px-6 pb-8 pt-6">
        <DotGrid />
        <div className="relative mx-auto max-w-3xl">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-neutral-100">Notes</h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
              {notes.length} saved
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-600">
            things you&apos;ve told Laura to remember, plus anything you jot down here
          </p>

          {/* Compose "node": Title + Body feed a Save action, mirroring a
              workflow editor's input-ports-into-an-action shape. */}
          <div className="relative mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="flex items-center gap-2">
              <PortDot color={title.trim() ? "emerald" : "neutral"} />
              <span className="text-[11px] tracking-wide text-neutral-500">Title</span>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Type what you want to remember…"
              className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-sm font-medium text-neutral-100 outline-none placeholder:font-normal placeholder:text-neutral-600 focus:border-emerald-500/40"
            />

            <div className="mt-3 flex items-center gap-2">
              <PortDot color={body.trim() ? "emerald" : "neutral"} />
              <span className="text-[11px] tracking-wide text-neutral-500">Body</span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write something…"
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-sm text-neutral-300 outline-none placeholder:text-neutral-600 focus:border-emerald-500/40"
            />

            <div className="mt-3 flex justify-end gap-2">
              {editingId && (
                <button
                  onClick={resetForm}
                  className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={save}
                disabled={!title.trim()}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1.5 text-xs font-medium text-neutral-950 transition-opacity hover:bg-emerald-400 disabled:opacity-40"
              >
                <span className="text-sm leading-none">+</span>
                {editingId ? "Save changes" : "Save note"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-6">
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {loaded && notes.length === 0 && (
          <p className="text-sm text-neutral-600">No notes yet.</p>
        )}

        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              title={note.title}
              body={note.body}
              updatedAt={note.updatedAt}
              onEdit={() => startEdit(note)}
              onDelete={() => remove(note.id)}
            />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-6 font-mono text-[11px] text-neutral-700">
        N: {notes.length}
        {lastUpdated && <> · last saved {new Date(lastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</>}
      </div>
    </div>
  );
}
