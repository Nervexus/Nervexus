"use client";

import { useEffect, useState } from "react";
import GlassFolder, {
  type ArtRecipe,
  type FolderFile,
  hashString,
} from "@/components/ui/glass-folder-cards";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";
import { LockIcon } from "@/components/icons";

type Note = { id: string; title: string; body: string; pinned: boolean; folderId: string; updatedAt: string };
type Folder = { id: string; name: string; locked: boolean; noteCount: number };

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
  const [saving, setSaving] = useState(false);
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
  const [folderError, setFolderError] = useState<string | null>(null);

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
        body: JSON.stringify({ name: newFolderName.trim(), pin: newFolderPin.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create the folder.");
      setAddingFolder(false);
      setNewFolderName("");
      setNewFolderPin("");
      load();
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : "Couldn't create the folder.");
    }
  }

  function selectNote(folderId: string, index: number) {
    const inFolder = notesByFolder(folderId);
    const note = inFolder[index];
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
        <h1 className="text-3xl tracking-tight text-neutral-100">Notes</h1>
      </div>
      <p className="gsap-entrance mt-2 text-sm text-neutral-500">
        things you&apos;ve told Laura to remember, plus anything you jot down here
      </p>

      {error && <p className="gsap-entrance mt-4 text-sm text-red-400">{error}</p>}

      <div className="gsap-entrance mt-10 flex flex-wrap justify-center gap-10">
        {!loaded ? (
          <p className="py-10 text-sm text-neutral-600">Loading…</p>
        ) : (
          <>
            {folders.map((folder) => {
              const isLocked = folder.locked && !unlockedIds.has(folder.id);
              const panelHere = panel?.folderId === folder.id ? panel.mode : null;
              const oldestFirst = notesByFolder(folder.id);
              const files: FolderFile[] = oldestFirst.map((n) => ({
                name: n.title,
                meta: formatMeta(n.updatedAt),
              }));

              return (
                <div key={folder.id} className="flex flex-col items-center gap-2" style={{ width: FOLDER_WIDTH }}>
                  <div className="flex w-full items-center justify-between px-1">
                    <span className="label truncate">
                      {folder.name}
                    </span>
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
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                        folder.locked ? "text-neutral-300 hover:text-neutral-100" : "text-neutral-600 hover:text-neutral-300"
                      }`}
                    >
                      <LockIcon className="h-3.5 w-3.5" />
                    </button>
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
                            className="w-full rounded-lg border border-line bg-neutral-950/60 px-3 py-1.5 text-center text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
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
                          className="font-mono text-xs text-neutral-500 transition-colors hover:text-neutral-200"
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
                        tone="dark"
                        art={MONO_ART}
                        seed={hashString(folder.id) % 97}
                        files={files}
                        action="add"
                        onAdd={() => {
                          addNote(folder.id);
                          return { name: "Untitled note", meta: "Just now" };
                        }}
                        onFileSelect={(_file, index) => selectNote(folder.id, index)}
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
                            className="w-full rounded-lg border border-line bg-neutral-950/60 px-3 py-1.5 text-center text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
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
                          className="font-mono text-[11px] text-neutral-600 transition-colors hover:text-neutral-300"
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
                            className="w-full rounded-lg border border-line bg-neutral-950/60 px-3 py-1.5 text-center text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
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
                    className="w-full rounded-lg border border-line bg-neutral-950/60 px-3 py-1.5 text-center text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
                  />
                  <input
                    type="password"
                    value={newFolderPin}
                    onChange={(e) => setNewFolderPin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFolder()}
                    placeholder="PIN (optional)"
                    className="w-full rounded-lg border border-line bg-neutral-950/60 px-3 py-1.5 text-center text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
                  />
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
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-neutral-600 transition-colors hover:border-neutral-600 hover:text-neutral-300"
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
        <div className="gradient-border relative mt-10 item p-6 backdrop-blur-md">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-line bg-neutral-950/60 px-3.5 py-2.5 text-sm font-normal text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
          />
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            placeholder="Write something…"
            rows={6}
            className="mt-3 w-full resize-none rounded-lg border border-line bg-neutral-950/60 px-3.5 py-2.5 text-sm font-normal text-neutral-300 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
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
