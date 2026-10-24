"use client";

import { useEffect, useState } from "react";
import GlassFolder, { type ArtRecipe, type FolderFile } from "@/components/ui/glass-folder-cards";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";

type Note = { id: string; title: string; body: string; pinned: boolean; updatedAt: string };

// Pure greys -- the app has no color accents anywhere, so the folder's
// generated artwork uses the same neutral palette as everything else
// instead of one of the component's colorful built-in presets.
const MONO_ART: ArtRecipe = {
  style: "marble",
  colors: ["#050505", "#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#f5f5f5"],
  scale: 0.7,
  warp: 3,
  gloss: 0.35,
  veins: 0.3,
};

function formatMeta(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Note | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [saving, setSaving] = useState(false);
  // Bumped after any change so <GlassFolder> remounts with the fresh list --
  // it only reads its `files` prop once, by design ("the folder owns the
  // list" after that), so syncing real server data back in means giving it
  // a fresh instance rather than expecting a prop update to take effect.
  const [generation, setGeneration] = useState(0);

  function load() {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => setNotes(data.notes ?? []))
      .catch(() => setError("Couldn't load notes."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  function selectNote(file: FolderFile, index: number) {
    const note = oldestFirst[index];
    if (!note) return;
    setSelected(note);
    setDraftTitle(note.title);
    setDraftBody(note.body);
  }

  async function save() {
    if (!selected || !draftTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draftTitle.trim(), body: draftBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save the note.");
      setSelected(null);
      setGeneration((g) => g + 1);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the note.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected) return;
    await fetch(`/api/notes/${selected.id}`, { method: "DELETE" });
    setSelected(null);
    setGeneration((g) => g + 1);
    load();
  }

  async function addNote() {
    // Fires once per "+" click: the folder shows "Untitled note" right
    // away, and this persists the same thing behind it so a reload matches.
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled note", body: "" }),
    });
    setGeneration((g) => g + 1);
    load();
  }

  // Oldest first, so the newest note ends up at the end of the array --
  // GlassFolder stacks the LAST files frontmost, nearest the glass.
  const oldestFirst = [...notes].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );
  const files: FolderFile[] = oldestFirst.map((n) => ({
    name: n.title,
    meta: formatMeta(n.updatedAt),
  }));

  return (
    <GsapEntrance className="relative mx-auto max-w-3xl px-6 pb-20">
      <div className="gsap-entrance flex items-center gap-3">
        <h1 className="font-thin text-3xl tracking-tight text-neutral-100">Notes</h1>
      </div>
      <p className="gsap-entrance mt-2 text-sm text-neutral-500">
        things you&apos;ve told Laura to remember, plus anything you jot down here
      </p>

      {error && <p className="gsap-entrance mt-4 text-sm text-red-400">{error}</p>}

      <div className="gsap-entrance mt-10 flex justify-center">
        {!loaded ? (
          <p className="py-10 text-sm text-neutral-600">Loading…</p>
        ) : (
          <GlassFolder
            key={generation}
            label="Notes"
            meta={`${notes.length} saved`}
            tone="dark"
            art={MONO_ART}
            seed={7}
            files={files}
            action="add"
            onAdd={() => {
              addNote();
              return { name: "Untitled note", meta: "Just now" };
            }}
            onFileSelect={selectNote}
          />
        )}
      </div>

      {selected && (
        <div className="gradient-border relative mt-10 rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-6 backdrop-blur-md">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-neutral-800/60 bg-neutral-950/60 px-3.5 py-2.5 text-sm font-light text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
          />
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            placeholder="Write something…"
            rows={6}
            className="mt-3 w-full resize-none rounded-lg border border-neutral-800/60 bg-neutral-950/60 px-3.5 py-2.5 text-sm font-light text-neutral-300 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
          />
          <div className="mt-3.5 flex justify-end gap-3">
            <Button variant="danger" onClick={remove}>
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !draftTitle.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </GsapEntrance>
  );
}
