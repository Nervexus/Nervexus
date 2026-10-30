"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { downscaleImage } from "@/lib/downscale";

type NoteImage = { id: string; data: string; caption: string | null };
type FullNote = { id: string; title: string; body: string; images: NoteImage[] };

/**
 * The note editor and reader, as an overlay that sits on top of the Notes
 * page until it's closed. Two modes: "edit" to change the text and manage
 * pictures, and "view" to read the whole note (text and photos) in full.
 * Pictures are attached with an optional caption — handy for a photo of
 * what needs fixing with a line describing the problem.
 */
export function NoteEditor({
  noteId,
  initialTitle,
  initialBody,
  onClose,
  onChanged,
}: {
  noteId: string;
  initialTitle: string;
  initialBody: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<"edit" | "view">("edit");
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [images, setImages] = useState<NoteImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pull the note's pictures (the list only carries a count).
  useEffect(() => {
    fetch(`/api/notes/${noteId}`)
      .then((r) => r.json())
      .then((d: { note?: FullNote }) => setImages(d.note?.images ?? []))
      .catch(() => {});
  }, [noteId]);

  // Close on Escape; lock the page scroll behind the overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (lightbox) setLightbox(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, lightbox]);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save the note.");
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the note.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    onChanged();
    onClose();
  }

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const data = await downscaleImage(file);
        const res = await fetch(`/api/notes/${noteId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't add that picture.");
        setImages((prev) => [...prev, body.image]);
      }
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that picture.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeImage(imageId: string) {
    setImages((prev) => prev.filter((i) => i.id !== imageId));
    await fetch(`/api/notes/${noteId}/images?imageId=${imageId}`, { method: "DELETE" }).catch(() => {});
    onChanged();
  }

  function saveCaption(imageId: string, caption: string) {
    setImages((prev) => prev.map((i) => (i.id === imageId ? { ...i, caption: caption.trim() || null } : i)));
    fetch(`/api/notes/${noteId}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, caption }),
    }).catch(() => {});
  }

  const viewing = mode === "view";

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-6">
      <div className="modal-backdrop absolute inset-0" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Note"}
        className="modal relative flex w-full max-w-2xl flex-col overflow-hidden !rounded-none sm:!rounded-[22px] sm:max-h-[88vh]"
      >
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
          <div className="tabs">
            <button onClick={() => setMode("edit")} className={`tab ${!viewing ? "is-active" : ""}`}>
              Edit
            </button>
            <button onClick={() => setMode("view")} className={`tab ${viewing ? "is-active" : ""}`}>
              Full view
            </button>
          </div>
          <button onClick={onClose} aria-label="Close" className="btn-ghost !px-2 !py-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* body (scrolls) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
          {/* shared, used by both modes */}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />

          {viewing ? (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="input !border-0 !bg-transparent !px-0 !text-[22px] !font-semibold !shadow-none"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write what's going on…"
                className="input mt-2 min-h-[42vh] flex-1 resize-none !border-0 !bg-transparent !px-0 !text-[15px] !leading-relaxed !shadow-none"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="label">Pictures {images.length > 0 && `· ${images.length}`}</span>
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn !py-1.5 !text-[12.5px]">
                  {uploading ? "Adding…" : "Add picture"}
                </button>
              </div>
              {images.length > 0 && (
                <div className="mt-3 flex flex-col gap-4">
                  {images.map((img) => (
                    <div key={img.id}>
                      <div className="relative overflow-hidden rounded-xl border border-line">
                        <button onClick={() => setLightbox(img.data)} className="block w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.data} alt={img.caption ?? "Note picture"} className="max-h-[60vh] w-full object-contain bg-neutral-100" />
                        </button>
                        <button
                          onClick={() => removeImage(img.id)}
                          aria-label="Remove picture"
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-4 w-4" aria-hidden>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                        </button>
                      </div>
                      <input
                        defaultValue={img.caption ?? ""}
                        onBlur={(e) => saveCaption(img.id, e.target.value)}
                        placeholder="What's the problem here?"
                        className="input mt-2 !py-1.5 !text-[13px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="input !text-[15px]"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write what's going on…"
                rows={7}
                className="input mt-3 resize-y"
              />

              <div className="mt-4 flex items-center justify-between">
                <span className="label">Pictures {images.length > 0 && `· ${images.length}`}</span>
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn !py-1.5 !text-[12.5px]">
                  {uploading ? "Adding…" : "Add picture"}
                </button>
              </div>
              <p className="mt-1 text-[12px] text-dim">Add a photo of what needs fixing, then write the problem under it.</p>

              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {images.map((img) => (
                    <div key={img.id} className="item overflow-hidden p-2">
                      <div className="relative">
                        <button onClick={() => setLightbox(img.data)} className="block w-full overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.data} alt={img.caption ?? "Note picture"} className="h-36 w-full object-cover bg-neutral-100" />
                        </button>
                        <button
                          onClick={() => removeImage(img.id)}
                          aria-label="Remove picture"
                          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-4 w-4" aria-hidden>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                        </button>
                      </div>
                      <input
                        defaultValue={img.caption ?? ""}
                        onBlur={(e) => saveCaption(img.id, e.target.value)}
                        placeholder="What's the problem here?"
                        className="input mt-2 !py-1.5 !text-[12.5px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>

        {/* footer */}
        <div className="flex justify-end gap-3 border-t border-line pt-3">
          <Button variant="danger" onClick={remove}>
            Delete
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !title.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}
