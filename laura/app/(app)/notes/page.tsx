"use client";

import { useEffect, useState } from "react";
import GlassFolder, {
  type ArtPreset,
  type ArtRecipe,
  type FolderFile,
  hashString,
} from "@/components/ui/glass-folder-cards";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";
import { LockIcon } from "@/components/icons";
import { NoteEditor } from "@/components/NoteEditor";

type Note = { id: string; title: string; body: string; pinned: boolean; folderId: string; updatedAt: string; imageCount?: number };
type Folder = { id: string; name: string; locked: boolean; noteCount: number; art: string; tone: "dark" | "light" };
type FolderFileWithId = FolderFile & { _noteId: string };

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

const FOLDER_WIDTH = 270;

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
  // Bumped after any change so <GlassFolder> remounts with the fresh list --
  // it only reads its `files` prop once, by design ("the folder owns the
  // list" after that), so syncing real server data back in means giving it
  // a fresh instance rather than expecting a prop update to take effect.
  const [generation, setGeneration] = useState(0);

  // Which locked folders have been unlocked for this visit -- never
  // persisted; reloading the page re-locks everything.
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<Panel | null>(null);
  const [pinDraft, setPinDraft] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);

  const [addingFolder, setAddingFolder] = useState(false);
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
      setAddingFolder(false);
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
    setGeneration((g) => g + 1);
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
    setGeneration((g) => g + 1);
    await fetch(`/api/notes/folders/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    }).catch(() => {});
  }

  async function deleteFolder(folderId: string) {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setNotes((prev) => prev.filter((n) => n.folderId !== folderId));
    setGeneration((g) => g + 1);
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
    // Fires once per "+" click: the folder shows "Untitled note" right
    // away, and this persists the same thing behind it so a reload matches.
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled note", body: "", folderId }),
    });
    setGeneration((g) => g + 1);
    load();
  }

  // Oldest first, so the newest note ends up at the end of the array --
  // GlassFolder stacks the LAST files frontmost, nearest the glass.
  function notesByFolder(folderId: string): Note[] {
    return notes
      .filter((n) => n.folderId === folderId)
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  }

  return (
    <GsapEntrance className="relative mx-auto max-w-5xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance flex items-center gap-3">
        <h1 className="page-title">Notes</h1>
      </div>
      <p className="gsap-entrance mt-2 text-sm text-neutral-500">
        things you&apos;ve told Laura to remember, plus anything you jot down here
      </p>

      {error && <p className="gsap-entrance mt-4 text-sm text-red-400">{error}</p>}

      <div className="gsap-entrance mt-8 flex flex-wrap justify-center gap-x-6 gap-y-8 sm:mt-10 sm:gap-10">
        {!loaded ? (
          <p className="py-10 text-sm text-neutral-600">Loading…</p>
        ) : (
          <>
            {folders.map((folder) => {
              const isLocked = folder.locked && !unlockedIds.has(folder.id);
              const panelHere = panel?.folderId === folder.id ? panel.mode : null;
              const oldestFirst = notesByFolder(folder.id);
              const files: FolderFileWithId[] = oldestFirst.map((n) => ({
                name: n.title,
                meta: `${formatMeta(n.updatedAt)}${n.imageCount ? ` · ${n.imageCount}📷` : ""}`,
                _noteId: n.id,
              }));

              return (
                <div key={folder.id} className="flex flex-col items-center gap-2" style={{ width: FOLDER_WIDTH }}>
                  <div className="relative flex w-full items-center justify-between px-1">
                    {renamingFolder === folder.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => renameFolder(folder.id, renameValue)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameFolder(folder.id, renameValue);
                          if (e.key === "Escape") setRenamingFolder(null);
                        }}
                        className="label w-0 min-w-0 flex-1 truncate rounded border border-line bg-transparent px-1 outline-none focus:border-accent/40"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setRenamingFolder(folder.id); setRenameValue(folder.name); }}
                        className="label truncate hover:text-text transition-colors"
                        title="Rename folder"
                      >
                        {folder.name}
                      </button>
                    )}
                    <div className="flex shrink-0 items-center gap-1">
                      {!isLocked && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPaletteFor(paletteFor === folder.id ? null : folder.id)}
                            aria-label="Folder colour"
                            aria-expanded={paletteFor === folder.id}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-neutral-600"
                          >
                            <span className="h-3.5 w-3.5 rounded-full border border-neutral-200" style={{ background: FOLDER_COLORS.find((c) => c.value === folder.art)?.swatch ?? FOLDER_COLORS[0].swatch }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { if (confirm(`Delete "${folder.name}" and all its notes?`)) deleteFolder(folder.id); }}
                            aria-label="Delete folder"
                            className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-red-500"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden>
                              <path d="M3 6h18M8 6V4h8v2M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          isLocked
                            ? openPanel({ folderId: folder.id, mode: "unlock" })
                            : folder.locked
                              ? lockNow(folder.id)
                              : openPanel({ folderId: folder.id, mode: "set-pin" })
                        }
                        aria-label={isLocked ? "Unlock folder" : folder.locked ? "Lock folder now" : "Lock this folder"}
                        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                          folder.locked ? "text-neutral-600 hover:text-neutral-800" : "text-neutral-400 hover:text-neutral-600"
                        }`}
                      >
                        <LockIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {paletteFor === folder.id && (
                      <div className="absolute right-0 top-7 z-20 flex gap-1.5 rounded-xl border border-line bg-white p-2 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)]">
                        {FOLDER_COLORS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => recolorFolder(folder.id, c.value)}
                            aria-label={c.label}
                            title={c.label}
                            className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${folder.art === c.value ? "border-neutral-800" : "border-neutral-200"}`}
                            style={{ background: c.swatch }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {isLocked ? (
                    <div
                      className="gradient-border relative flex flex-col items-center justify-center gap-3 item p-6 backdrop-blur-md"
                      style={{ width: FOLDER_WIDTH, height: FOLDER_WIDTH * 0.96 }}
                    >
                      <LockIcon className="h-6 w-6 text-neutral-500" />
                      {panelHere === "unlock" ? (
                        <div className="flex w-full flex-col gap-2 px-2">
                          <input
                            type="password"
                            autoFocus
                            value={pinDraft}
                            onChange={(e) => setPinDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && submitUnlock(folder.id)}
                            placeholder="PIN"
                            className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-center text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-accent/40"
                          />
                          {pinError && <p className="text-center text-xs text-red-400">{pinError}</p>}
                          <div className="flex justify-center gap-3">
                            <Button variant="ghost" onClick={closePanel}>
                              Cancel
                            </Button>
                            <Button onClick={() => submitUnlock(folder.id)} disabled={pinBusy || !pinDraft}>
                              {pinBusy ? "Checking…" : "Unlock"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openPanel({ folderId: folder.id, mode: "unlock" })}
                          className="font-mono text-xs text-neutral-500 transition-colors hover:text-neutral-700"
                        >
                          Enter PIN to open
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <GlassFolder
                        key={`${folder.id}-${generation}`}
                        width={FOLDER_WIDTH}
                        label={folder.name}
                        meta={`${folder.noteCount} saved`}
                        tone={folder.tone}
                        art={folder.art === "mono" ? MONO_ART : (folder.art as ArtPreset)}
                        seed={hashString(folder.id) % 97}
                        files={files}
                        action="add"
                        onAdd={() => {
                          addNote(folder.id);
                          return { name: "Untitled note", meta: "Just now" };
                        }}
                        onFileSelect={(file) => {
                          const id = (file as FolderFileWithId)._noteId;
                          if (id) openNote(id);
                        }}
                      />
                      {panelHere === "set-pin" && (
                        <div className="flex w-full flex-col gap-2 px-2">
                          <input
                            type="password"
                            autoFocus
                            value={pinDraft}
                            onChange={(e) => setPinDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && submitSetPin(folder.id)}
                            placeholder="Choose a PIN"
                            className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-center text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-accent/40"
                          />
                          {pinError && <p className="text-center text-xs text-red-400">{pinError}</p>}
                          <div className="flex justify-center gap-3">
                            <Button variant="ghost" onClick={closePanel}>
                              Cancel
                            </Button>
                            <Button onClick={() => submitSetPin(folder.id)} disabled={pinBusy || !pinDraft.trim()}>
                              {pinBusy ? "Locking…" : "Lock it"}
                            </Button>
                          </div>
                        </div>
                      )}
                      {folder.locked && panelHere !== "remove-pin" && (
                        <button
                          type="button"
                          onClick={() => openPanel({ folderId: folder.id, mode: "remove-pin" })}
                          className="font-mono text-[11px] text-neutral-400 transition-colors hover:text-neutral-600"
                        >
                          Remove lock
                        </button>
                      )}
                      {panelHere === "remove-pin" && (
                        <div className="flex w-full flex-col gap-2 px-2">
                          <input
                            type="password"
                            autoFocus
                            value={pinDraft}
                            onChange={(e) => setPinDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && submitRemovePin(folder.id)}
                            placeholder="Current PIN"
                            className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-center text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-accent/40"
                          />
                          {pinError && <p className="text-center text-xs text-red-400">{pinError}</p>}
                          <div className="flex justify-center gap-3">
                            <Button variant="ghost" onClick={closePanel}>
                              Cancel
                            </Button>
                            <Button variant="danger" onClick={() => submitRemovePin(folder.id)} disabled={pinBusy || !pinDraft}>
                              {pinBusy ? "Removing…" : "Remove"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            <div className="flex flex-col items-center gap-2" style={{ width: FOLDER_WIDTH }}>
              <span className="label w-full px-1 text-transparent">·</span>
              {addingFolder ? (
                <div
                  className="gradient-border relative flex flex-col items-center justify-center gap-3 item p-6 backdrop-blur-md"
                  style={{ width: FOLDER_WIDTH, height: FOLDER_WIDTH * 0.96 }}
                >
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-center text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-accent/40"
                  />
                  <input
                    type="password"
                    value={newFolderPin}
                    onChange={(e) => setNewFolderPin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFolder()}
                    placeholder="PIN (optional)"
                    className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-center text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-accent/40"
                  />
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {FOLDER_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewFolderArt(c.value)}
                        aria-label={c.label}
                        title={c.label}
                        className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${newFolderArt === c.value ? "border-neutral-800" : "border-neutral-200"}`}
                        style={{ background: c.swatch }}
                      />
                    ))}
                  </div>
                  {folderError && <p className="text-center text-xs text-red-400">{folderError}</p>}
                  <div className="flex justify-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setAddingFolder(false);
                        setNewFolderName("");
                        setNewFolderPin("");
                        setFolderError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={addFolder} disabled={!newFolderName.trim()}>
                      Create
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingFolder(true)}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600"
                  style={{ width: FOLDER_WIDTH, height: FOLDER_WIDTH * 0.96 }}
                >
                  <span className="text-2xl">+</span>
                  <span className="font-mono text-xs">New folder</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {selected && (
        <NoteEditor
          noteId={selected.id}
          initialTitle={draftTitle}
          initialBody={draftBody}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setGeneration((g) => g + 1);
            load();
          }}
        />
      )}
    </GsapEntrance>
  );
}
