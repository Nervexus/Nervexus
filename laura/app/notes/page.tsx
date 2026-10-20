"use client";

import { useEffect, useState } from "react";
import { HudCard, HexBadge } from "@/components/HudCard";
import { NoteIcon } from "@/components/icons";

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

  return (
    <div className="flex-1">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="font-semibold tracking-tight">Notes</h1>
        <p className="text-xs text-neutral-500">
          things you&apos;ve told Laura to remember, plus anything you jot down here
        </p>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-6">
        <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-neutral-600"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write something…"
            rows={3}
            className="mt-2 w-full resize-none bg-transparent text-sm text-neutral-300 outline-none placeholder:text-neutral-600"
          />
          <div className="mt-2 flex justify-end gap-2">
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
              className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 disabled:opacity-40"
            >
              {editingId ? "Save changes" : "Add note"}
            </button>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {loaded && notes.length === 0 && (
          <p className="text-sm text-neutral-600">No notes yet.</p>
        )}

        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <HudCard key={note.id}>
              <div className="flex items-start gap-3">
                <HexBadge>
                  <NoteIcon className="h-4 w-4" />
                </HexBadge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium">{note.title}</h3>
                    <div className="flex shrink-0 gap-3 text-xs text-neutral-500">
                      <button onClick={() => startEdit(note)} className="hover:text-neutral-200">
                        Edit
                      </button>
                      <button onClick={() => remove(note.id)} className="hover:text-red-400">
                        Delete
                      </button>
                    </div>
                  </div>
                  {note.body && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-400">{note.body}</p>
                  )}
                </div>
              </div>
            </HudCard>
          ))}
        </div>
      </div>
    </div>
  );
}
