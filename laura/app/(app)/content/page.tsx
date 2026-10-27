"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { SidebarCard, Stat } from "@/components/SidebarCard";
import { ContentCard } from "@/components/ContentCard";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";

type Idea = {
  id: string;
  title: string;
  type: string;
  status: string;
  caption: string | null;
  hashtags: string | null;
  location: string | null;
  outfit: string | null;
  scheduledAt: string | null;
};

const TYPES = ["post", "reel", "story", "other"] as const;

export default function ContentPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscarded, setShowDiscarded] = useState(false);

  const [handle, setHandle] = useState("");
  const [researching, setResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("post");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");

  function load() {
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => setIdeas(data.ideas ?? []))
      .catch(() => setError("Couldn't load content ideas."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  async function research() {
    if (!handle.trim()) return;
    setResearching(true);
    setError(null);
    setResearchResult(null);
    try {
      const res = await fetch("/api/content/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't research that account.");
      setResearchResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't research that account.");
    } finally {
      setResearching(false);
    }
  }

  async function addIdea() {
    if (!title.trim()) return;
    setError(null);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          caption: caption || undefined,
          hashtags: hashtags || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save the content idea.");
      setTitle("");
      setCaption("");
      setHashtags("");
      setType("post");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the content idea.");
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/content/${id}`, { method: "DELETE" });
    load();
  }

  const active = ideas.filter((i) => i.status !== "discarded");
  const discarded = ideas.filter((i) => i.status === "discarded");
  const scheduled = active.filter((i) => i.status === "scheduled");
  const posted = active.filter((i) => i.status === "posted");
  const drafts = active.filter((i) => i.status === "idea");

  const SECTIONS: { label: string; items: Idea[] }[] = [
    { label: "Scheduled", items: scheduled },
    { label: "Ideas", items: drafts },
    { label: "Posted", items: posted },
    ...(showDiscarded ? [{ label: "Discarded", items: discarded }] : []),
  ];

  return (
    <GsapEntrance className="relative mx-auto max-w-5xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance flex items-center gap-3">
        <h1 className="page-title">Content</h1>
        <Pill>{active.length} tracked</Pill>
      </div>
      <p className="gsap-entrance mt-2 text-sm text-neutral-500">
        Instagram post ideas Laura&apos;s helped brainstorm or you&apos;ve noted — no account is
        connected yet, so this is research and planning, never posting
      </p>

      <div className="gsap-entrance relative mt-8 card p-5">
        <span className="label">
          Research a public account
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && research()}
            placeholder="@someaccount"
            className="min-w-0 flex-1 input text-sm text-neutral-300 outline-none placeholder:text-neutral-600"
          />
          <Button variant="accent" onClick={research} disabled={researching || !handle.trim()}>
            {researching ? "Researching…" : "Research"}
          </Button>
        </div>
        {researchResult && (
          <div className="mt-4 input">
            <p className="whitespace-pre-wrap text-sm text-neutral-300">{researchResult}</p>
          </div>
        )}
      </div>

      <div className="gsap-entrance relative mt-4 card p-5">
        <span className="label">
          Add an idea by hand
        </span>
        <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title, e.g. Beach sunset reel"
            className="input text-sm text-neutral-300 outline-none placeholder:text-neutral-600"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
            className="input text-sm text-neutral-300 outline-none [color-scheme:dark]"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            rows={2}
            className="input text-sm text-neutral-300 outline-none placeholder:text-neutral-600 sm:col-span-2"
          />
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="Hashtags, comma-separated (optional)"
            className="input text-sm text-neutral-300 outline-none placeholder:text-neutral-600 sm:col-span-2"
          />
        </div>
        <div className="mt-3.5 flex justify-end">
          <Button variant="accent" onClick={addIdea} disabled={!title.trim()}>
            Add idea
          </Button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          {error && <p className="gsap-entrance mb-4 text-sm text-red-400">{error}</p>}

          {loaded && active.length === 0 ? (
            <EmptyState
              icon={<iconify-icon icon="solar:gallery-linear" className="text-lg" />}
              title="No content ideas yet"
              description="Research an account for inspiration, or add one above."
            />
          ) : (
            SECTIONS.map(
              ({ label, items }) =>
                items.length > 0 && (
                  <div key={label} className="mb-8">
                    <h2 className="label mb-3">
                      {label} · {items.length}
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3">
                      {items.map((idea) => (
                        <div key={idea.id} className="gsap-entrance">
                          <ContentCard
                            {...idea}
                            onStatusChange={(status) => updateStatus(idea.id, status)}
                            onDelete={() => remove(idea.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )
          )}

          {discarded.length > 0 && (
            <button
              onClick={() => setShowDiscarded((s) => !s)}
              className="label hover:text-neutral-300"
            >
              {showDiscarded ? "Hide" : "Show"} discarded ({discarded.length})
            </button>
          )}
        </div>

        <aside className="gsap-entrance flex flex-col gap-4">
          <SidebarCard title="Stats">
            <div className="flex flex-col gap-2">
              <Stat label="Scheduled" value={scheduled.length} />
              <Stat label="Ideas" value={drafts.length} />
              <Stat label="Posted" value={posted.length} />
            </div>
          </SidebarCard>
        </aside>
      </div>
    </GsapEntrance>
  );
}
