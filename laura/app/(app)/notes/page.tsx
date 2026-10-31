"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";
import { Pill } from "@/components/Pill";
import { Empty, Group, PageHeader, Row, Section } from "@/components/ui/layout";
import { LockIcon } from "@/components/icons";
import { NoteEditor } from "@/components/NoteEditor";

type Note = { id: string; title: string; body: string; pinned: boolean; folderId: string; updatedAt: string; imageCount?: number };
type Folder = { id: string; name: string; locked: boolean; noteCount: number; art: string; tone: "dark" | "light" };

// The colours a folder can wear. "mono" is the default grey; the rest are
// the folder component's built-in art presets.
const FOLDER_COLORS: { value: string; label: string; swatch: string }[] = [
  { value: "mono", label: "Mono", swatch: "linear-gradient(135deg,#737373,#d4d4d4)" },
  { value: "aurora", label: "Aurora", swatch: "linear-gradient(135deg,#c2433f,#6f97c2)" },
  { value: "ember", label: "Ember", swatch: "linear-gradient(135deg,#3d5f68,#ef4a2b)" },
  { value: "dusk", label: "Dusk", swatch: "linear-gradient(135deg,#8f6c9c,#eab08a)" },
  { value: "glacier", label: "Glacier", swatch: "linear-gradient(135deg,#9fb4c7,#ffffff)" },
  { value: "verdant", label: "Verdant", swatch: "linear-gradient(135deg,#4f7a5a,#e9cf87)" },
];

function formatMeta(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

// At most one of these is open at a time -- a PIN prompt to unlock a
// folder, to set a new one, or to confirm removing an existing one.
type Panel = { folderId: string; mode: "unlock" | "set-pin" | "remove-pin" };

export default function NotesPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Note | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  // Which locked folders have been unlocked for this visit -- never
  // persisted; reloading the page re-locks everything.
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<Panel | null>(null);
  const [pinDraft, setPinDraft] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);

  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderPin, setNewFolderPin] = useState("");
  const [newFolderArt, setNewFolderArt] = useState("mono");
  const [folderError, setFolderError] = useState<string | null>(null);
  const [paletteFor, setPaletteFor] = useState<string | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function load() {
    Promise.all([
      fetch("/api/notes").then((r) => r.json()),
      fetch("/api/notes/folders").then((r) => r.json()),
    ])
      .then(([notesData, foldersData]) => {
        setNotes(notesData.notes ?? []);
        setFolders(foldersData.folders ?? []);
      })
      .catch(() => setError("Couldn't load notes."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  function openPanel(next: Panel) {
    setPanel(next);
    setPinDraft("");
    setPinError(null);
  }

  function closePanel() {
    setPanel(null);
    setPinDraft("");
    setPinError(null);
  }

  async function submitUnlock(folderId: string) {
    setPinBusy(true);
    setPinError(null);
    try {
      const res = await fetch(`/api/notes/folders/${folderId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "That PIN is wrong.");
      setUnlockedIds((prev) => new Set(prev).add(folderId));
      closePanel();
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "That PIN is wrong.");
    } finally {
      setPinBusy(false);
    }
  }

  async function submitSetPin(folderId: string) {
    if (!pinDraft.trim()) return;
    setPinBusy(true);
    setPinError(null);
    try {
      const res = await fetch(`/api/notes/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't lock the folder.");
      setUnlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
      closePanel();
      load();
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Couldn't lock the folder.");
    } finally {
      setPinBusy(false);
    }
  }

  async function submitRemovePin(folderId: string) {
    setPinBusy(true);
    setPinError(null);
    try {
      const res = await fetch(`/api/notes/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeLock: true, currentPin: pinDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "That PIN is wrong.");
      closePanel();
      load();
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "That PIN is wrong.");
    } finally {
      setPinBusy(false);
    }
  }

  function lockNow(folderId: string) {
    setUnlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(folderId);
      return next;
    });
  }

  async function addFolder() {
    if (!newFolderName.trim()) return;
    setFolderError(null);
    try {
      const res = await fetch("/api/notes/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim(), pin: newFolderPin.trim() || undefined, art: newFolderArt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create the folder.");
      setNewFolderName("");
      setNewFolderPin("");
      setNewFolderArt("mono");
      load();
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : "Couldn't create the folder.");
    }
  }

  async function recolorFolder(folderId: string, art: string) {
    setPaletteFor(null);
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, art } : f)));
    await fetch(`/api/notes/folders/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ art }),
    }).catch(() => {});
  }

  async function renameFolder(folderId: string, name: string) {
    if (!name.trim()) return;
    setRenamingFolder(null);
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: name.trim() } : f)));
    await fetch(`/api/notes/folders/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    }).catch(() => {});
  }

  async function deleteFolder(folderId: string) {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setNotes((prev) => prev.filter((n) => n.folderId !== folderId));
    await fetch(`/api/notes/folders/${folderId}`, { method: "DELETE" }).catch(() => {});
  }

  function openNote(noteId: string) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    setSelected(note);
    setDraftTitle(note.title);
    setDraftBody(note.body);
  }



  async function addNote(folderId: string) {
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled note", body: "", folderId }),
    });
    load();
  }

  // Oldest first; the folder list reverses it to show the newest on top.
  function notesByFolder(folderId: string): Note[] {
    return notes
      .filter((n) => n.folderId === folderId)
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  }

  const pinInput = (onEnter: () => void, placeholder: string) => (
    <input
      type="password"
      autoFocus
      value={pinDraft}
      onChange={(e) => setPinDraft(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onEnter()}
      placeholder={placeholder}
      className="input min-w-0 flex-1 text-sm"
    />
  );

  return (
    <GsapEntrance className="relative mx-auto max-w-3xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance">
        <PageHeader
          title="Notes"
          meta={<Pill>{notes.length} saved</Pill>}
          sub="Things you've told Laura to remember, plus anything you jot down."
        />
      </div>

      {error && <p className="gsap-entrance mb-4 text-sm text-red-400">{error}</p>}

      {!loaded ? (
        <p className="gsap-entrance py-10 text-center text-sm text-neutral-600">Loading…</p>
      ) : (
        <Group title="Folders" className="gsap-entrance">
          {folders.length === 0 && <Empty>No folders yet. Create one below.</Empty>}
          {folders.map((folder) => {
            const isLocked = folder.locked && !unlockedIds.has(folder.id);
            const panelHere = panel?.folderId === folder.id ? panel.mode : null;
            const newestFirst = notesByFolder(folder.id).reverse();
            const swatch = FOLDER_COLORS.find((c) => c.value === folder.art)?.swatch ?? FOLDER_COLORS[0].swatch;
            return (
              <Section
                key={folder.id}
                title={folder.name}
                icon={folder.locked ? "solar:lock-keyhole-minimalistic-linear" : "solar:folder-linear"}
                summary={
                  <span className="inline-flex items-center gap-2">
                    {isLocked ? "Locked" : `${folder.noteCount} ${folder.noteCount === 1 ? "note" : "notes"}`}
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: swatch }} />
                  </span>
                }
              >
                {isLocked ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {pinInput(() => submitUnlock(folder.id), "Enter PIN")}
                      <Button
                        onClick={() => (panelHere === "unlock" ? submitUnlock(folder.id) : openPanel({ folderId: folder.id, mode: "unlock" }))}
                        disabled={pinBusy || (panelHere === "unlock" && !pinDraft)}
                      >
                        {pinBusy ? "Checking…" : "Unlock"}
                      </Button>
                    </div>
                    {panelHere === "unlock" && pinError && <p className="text-xs text-red-400">{pinError}</p>}
                  </div>
                ) : (
                  <>
                    {newestFirst.length === 0 ? (
                      <p className="py-2 text-[13px] text-muted">No notes in this folder yet.</p>
                    ) : (
                      newestFirst.map((n) => (
                        <Row
                          key={n.id}
                          onClick={() => openNote(n.id)}
                          title={n.title || "Untitled note"}
                          sub={n.body ? n.body.slice(0, 90) : undefined}
                          trailing={
                            <span className="text-[12px] text-dim">
                              {formatMeta(n.updatedAt)}
                              {n.imageCount ? ` · ${n.imageCount} 📷` : ""}
                            </span>
                          }
                        />
                      ))
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => addNote(folder.id)} className="btn !px-4 !py-2 text-xs">
                        + New note
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRenamingFolder(folder.id); setRenameValue(folder.name); }}
                        className="btn-ghost text-xs"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaletteFor(paletteFor === folder.id ? null : folder.id)}
                        aria-expanded={paletteFor === folder.id}
                        className="btn-ghost text-xs"
                      >
                        Colour
                      </button>
                      <button
                        type="button"
                        onClick={() => (folder.locked ? lockNow(folder.id) : openPanel({ folderId: folder.id, mode: "set-pin" }))}
                        className="btn-ghost text-xs"
                      >
                        <LockIcon className="h-3.5 w-3.5" />
                        {folder.locked ? "Lock now" : "Add lock"}
                      </button>
                      {folder.locked && (
                        <button type="button" onClick={() => openPanel({ folderId: folder.id, mode: "remove-pin" })} className="btn-ghost text-xs">
                          Remove lock
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { if (confirm(`Delete "${folder.name}" and all its notes?`)) deleteFolder(folder.id); }}
                        className="btn-ghost text-xs hover:!text-red-500"
                      >
                        Delete
                      </button>
                    </div>

                    {renamingFolder === folder.id && (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => renameFolder(folder.id, renameValue)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameFolder(folder.id, renameValue);
                          if (e.key === "Escape") setRenamingFolder(null);
                        }}
                        className="input mt-3 text-sm"
                      />
                    )}

                    {paletteFor === folder.id && (
                      <div className="mt-3 flex gap-2">
                        {FOLDER_COLORS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => recolorFolder(folder.id, c.value)}
                            aria-label={c.label}
                            title={c.label}
                            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${folder.art === c.value ? "border-neutral-800" : "border-transparent"}`}
                            style={{ background: c.swatch }}
                          />
                        ))}
                      </div>
                    )}

                    {(panelHere === "set-pin" || panelHere === "remove-pin") && (
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex gap-2">
                          {panelHere === "set-pin"
                            ? pinInput(() => submitSetPin(folder.id), "Choose a PIN")
                            : pinInput(() => submitRemovePin(folder.id), "Current PIN")}
                          <Button variant="ghost" onClick={closePanel}>
                            Cancel
                          </Button>
                          {panelHere === "set-pin" ? (
                            <Button onClick={() => submitSetPin(folder.id)} disabled={pinBusy || !pinDraft.trim()}>
                              {pinBusy ? "Locking…" : "Lock it"}
                            </Button>
                          ) : (
                            <Button variant="danger" onClick={() => submitRemovePin(folder.id)} disabled={pinBusy || !pinDraft}>
                              {pinBusy ? "Removing…" : "Remove"}
                            </Button>
                          )}
                        </div>
                        {pinError && <p className="text-xs text-red-400">{pinError}</p>}
                      </div>
                    )}
                  </>
                )}
              </Section>
            );
          })}

          <Section title="New folder" icon="solar:add-folder-linear">
            <div className="flex flex-col gap-2">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="input text-sm"
              />
              <input
                type="password"
                value={newFolderPin}
                onChange={(e) => setNewFolderPin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFolder()}
                placeholder="PIN (optional)"
                className="input text-sm"
              />
              <div className="flex flex-wrap gap-2 py-1">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewFolderArt(c.value)}
                    aria-label={c.label}
                    title={c.label}
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${newFolderArt === c.value ? "border-neutral-800" : "border-transparent"}`}
                    style={{ background: c.swatch }}
                  />
                ))}
              </div>
              {folderError && <p className="text-xs text-red-400">{folderError}</p>}
              <Button onClick={addFolder} disabled={!newFolderName.trim()}>
                Create folder
              </Button>
            </div>
          </Section>
        </Group>
      )}

      {selected && (
        <NoteEditor
          noteId={selected.id}
          initialTitle={draftTitle}
          initialBody={draftBody}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      )}
    </GsapEntrance>
  );
}
