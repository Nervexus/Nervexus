"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ChecklistCard } from "@/components/ChecklistCard";
import { GlassCard } from "@/components/GlassCard";
import { PlusIcon } from "@/components/icons";
import { uid, useLocalStorage } from "@/lib/useLocalStorage";
import type { Checklist } from "@/lib/types";

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useLocalStorage<Checklist[]>(
    "checklists",
    []
  );
  const [draft, setDraft] = useState("");

  function createChecklist() {
    const title = draft.trim();
    if (!title) return;
    const next: Checklist = {
      id: uid(),
      title,
      items: [],
      createdAt: Date.now(),
    };
    setChecklists((prev) => [next, ...prev]);
    setDraft("");
  }

  function updateChecklist(id: string, next: Checklist) {
    setChecklists((prev) => prev.map((c) => (c.id === id ? next : c)));
  }

  function deleteChecklist(id: string) {
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Stay organized"
        title="Checklists"
        subtitle="Build any list and knock it out."
        back
      />

      <GlassCard className="mb-6 flex items-center gap-2 p-2 pl-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createChecklist()}
          placeholder="New checklist name..."
          className="flex-1 bg-transparent py-2 text-sm placeholder:text-muted/70 focus:outline-none"
        />
        <button
          onClick={createChecklist}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-transform active:scale-95"
          aria-label="Create checklist"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </GlassCard>

      <div className="flex flex-col gap-4">
        {checklists.map((checklist) => (
          <ChecklistCard
            key={checklist.id}
            checklist={checklist}
            onChange={(next) => updateChecklist(checklist.id, next)}
            onDelete={() => deleteChecklist(checklist.id)}
          />
        ))}
        {checklists.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            No checklists yet. Create your first one above.
          </p>
        )}
      </div>
    </div>
  );
}
