"use client";

import { useEffect, useMemo, useState } from "react";
import { DotGrid } from "@/components/DotGrid";
import { NoteCard, PortDot } from "@/components/NoteCard";
import { EmptyState } from "@/components/EmptyState";
import { SidebarCard, Chip, Stat } from "@/components/SidebarCard";
import { NoteIcon, SearchIcon } from "@/components/icons";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";

type Note = { id: string; title: string; body: string; pinned: boolean; updatedAt: string };

const QUICK_START = ["Wifi password", "Grocery list", "Gift ideas", "Packing list", "Important dates"];

function isThisWeek(iso: string): boolean {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(iso).getTime() >= weekAgo;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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

  async function togglePin(note: Note) {
    setNotes((prev) =>
      prev
        .map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned))
    );
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    load();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }, [notes, query]);

  const lastUpdated = notes[0]?.updatedAt;
  const thisWeek = notes.filter((n) => isThisWeek(n.updatedAt)).length;
  const pinnedCount = notes.filter((n) => n.pinned).length;

  return (
    <div className="relative flex-1">
      <div className="relative overflow-hidden border-b border-neutral-800 px-8 pb-10 pt-8">
        <DotGrid />
        <div className="relative mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl text-neutral-50">Notes</h1>
            <Pill>{notes.length} saved</Pill>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            things you&apos;ve told Laura to remember, plus anything you jot down here
          </p>

          {/* Compose "node": Title + Body feed a Save action, mirroring a
              workflow editor's input-ports-into-an-action shape. */}
          <div className="relative mt-7 rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <PortDot color={title.trim() ? "emerald" : "neutral"} />
              <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">Title</span>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Type what you want to remember…"
              className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm font-medium text-neutral-100 outline-none placeholder:font-normal placeholder:text-neutral-600 focus:border-amber-500/40"
            />

            <div className="mt-3.5 flex items-center gap-2">
              <PortDot color={body.trim() ? "emerald" : "neutral"} />
              <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">Body</span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write something…"
              rows={4}
              className="mt-1.5 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm text-neutral-300 outline-none placeholder:text-neutral-600 focus:border-amber-500/40"
            />

            <div className="mt-3.5 flex justify-end gap-2">
              {editingId && (
                <Button variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button onClick={save} disabled={!title.trim()}>
                <span className="text-sm leading-none">+</span>
                {editingId ? "Save changes" : "Save note"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-8 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

            {notes.length > 0 && (
              <div className="relative mb-5">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notes…"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 py-2.5 pl-10 pr-4 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-amber-500/40"
                />
              </div>
            )}

            {loaded && notes.length === 0 ? (
              <EmptyState
                icon={<NoteIcon className="h-5 w-5" />}
                title="No notes yet"
                description="Ask Laura to remember something, jot one down above, or try a quick start."
              >
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {QUICK_START.map((suggestion) => (
                    <Chip key={suggestion} onClick={() => setTitle(suggestion)}>
                      {suggestion}
                    </Chip>
                  ))}
                </div>
              </EmptyState>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-600">
                No notes match &quot;{query}&quot;.
              </p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
                {filtered.map((note) => (
                  <NoteCard
                    key={note.id}
                    title={note.title}
                    body={note.body}
                    updatedAt={note.updatedAt}
                    pinned={note.pinned}
                    onEdit={() => startEdit(note)}
                    onDelete={() => remove(note.id)}
                    onTogglePin={() => togglePin(note)}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <SidebarCard title="Quick start">
              <div className="flex flex-wrap gap-2">
                {QUICK_START.map((suggestion) => (
                  <Chip key={suggestion} onClick={() => setTitle(suggestion)}>
                    {suggestion}
                  </Chip>
                ))}
              </div>
            </SidebarCard>

            <SidebarCard title="Stats">
              <div className="flex flex-col gap-2">
                <Stat label="Total notes" value={notes.length} />
                <Stat label="Pinned" value={pinnedCount} />
                <Stat label="Updated this week" value={thisWeek} />
              </div>
            </SidebarCard>
          </aside>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-8 font-mono text-[11px] text-neutral-700">
        N: {notes.length}
        {lastUpdated && <> · last saved {new Date(lastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</>}
      </div>
    </div>
  );
}
