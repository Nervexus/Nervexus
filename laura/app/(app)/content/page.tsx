"use client";

import { useEffect, useState } from "react";
import { ContentCard } from "@/components/ContentCard";
import { Pill } from "@/components/Pill";
import { GsapEntrance } from "@/components/GsapEntrance";
import { Empty, Group, PageHeader, Row, Section } from "@/components/ui/layout";

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
const VIEWS = ["all", "scheduled", "idea", "posted", "discarded"] as const;
const VIEW_LABEL: Record<(typeof VIEWS)[number], string> = {
  all: "All",
  scheduled: "Scheduled",
  idea: "Ideas",
  posted: "Posted",
  discarded: "Discarded",
};

export default function ContentPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<(typeof VIEWS)[number]>("all");

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

  const shown = view === "all" ? [...scheduled, ...drafts, ...posted] : ideas.filter((i) => i.status === view);
  const views = VIEWS.filter((v) => v !== "discarded" || discarded.length > 0);

  return (
    <GsapEntrance className="relative mx-auto max-w-3xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance">
        <PageHeader title="Content" meta={<Pill>{active.length} tracked</Pill>} sub="Instagram ideas and research. Nothing is ever posted for you." />
      </div>

      {error && <p className="gsap-entrance mb-4 text-sm text-red-400">{error}</p>}

      <div className="gsap-entrance overflow-x-auto">
        <div className="tabs">
          {views.map((v) => (
            <button key={v} onClick={() => setView(v)} className={`tab whitespace-nowrap ${view === v ? "is-active" : ""}`}>
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="gsap-entrance mt-3">
        <Group>
          {!loaded ? (
            <Empty>Loading…</Empty>
          ) : shown.length === 0 ? (
            <Empty>{view === "all" ? "No content ideas yet. Add one below, or research an account." : `Nothing ${VIEW_LABEL[view].toLowerCase()}.`}</Empty>
          ) : (
            shown.map((idea) => (
              <ContentCard
                key={idea.id}
                {...idea}
                onStatusChange={(status) => updateStatus(idea.id, status)}
                onDelete={() => remove(idea.id)}
              />
            ))
          )}
        </Group>
      </div>

      <div className="gsap-entrance mt-6">
        <Group>
          <Section title="Add an idea" icon="solar:add-circle-linear">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. Beach sunset reel" className="input text-sm" />
              <select value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])} className="input text-sm capitalize [color-scheme:light]">
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" rows={2} className="input text-sm sm:col-span-2" />
              <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="Hashtags, comma-separated (optional)" className="input text-sm sm:col-span-2" />
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={addIdea} disabled={!title.trim()} className="btn btn-primary">
                Add idea
              </button>
            </div>
          </Section>
          <Section title="Research an account" icon="solar:magnifer-linear" summary="Public accounts">
            <div className="flex items-center gap-2">
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && research()}
                placeholder="@someaccount"
                className="input min-w-0 flex-1 text-sm"
              />
              <button onClick={research} disabled={researching || !handle.trim()} className="btn btn-primary shrink-0">
                {researching ? "Researching…" : "Research"}
              </button>
            </div>
            {researchResult && (
              <div className="panel mt-3 px-4 py-3">
                <p className="whitespace-pre-wrap text-sm text-neutral-600">{researchResult}</p>
              </div>
            )}
          </Section>
          <Section title="Overview" icon="solar:chart-2-linear" summary={`${scheduled.length} scheduled · ${drafts.length} ideas`}>
            {[
              { label: "Scheduled", value: scheduled.length },
              { label: "Ideas", value: drafts.length },
              { label: "Posted", value: posted.length },
              { label: "Discarded", value: discarded.length },
            ].map((s) => (
              <Row key={s.label} title={s.label} trailing={<span className="font-mono text-[13px] tabular-nums text-muted">{s.value}</span>} />
            ))}
          </Section>
        </Group>
      </div>
    </GsapEntrance>
  );
}
