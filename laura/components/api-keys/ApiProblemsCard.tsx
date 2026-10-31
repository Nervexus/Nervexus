"use client";

import { useEffect, useState } from "react";
import { IssueRow, KEYS_CHANGED, duration, type Issue } from "@/components/api-keys/shared";
import { Section } from "@/components/ui/layout";

/** Settings: what's down now (with a paste box) and the history of past outages. */
export function ApiProblemsCard() {
  const [data, setData] = useState<{ open: Issue[]; history: Issue[] } | null>(null);

  function load() {
    fetch("/api/issues")
      .then((res) => res.json())
      .then((d) => setData({ open: d.open ?? [], history: d.history ?? [] }))
      .catch(() => setData({ open: [], history: [] }));
  }

  useEffect(() => {
    load();
    window.addEventListener(KEYS_CHANGED, load);
    return () => window.removeEventListener(KEYS_CHANGED, load);
  }, []);

  // Mount the Section only once data is in, so it can open itself when something is down.
  if (!data) return null;
  return (
    <Section
      title="API problems"
      icon="solar:danger-triangle-linear"
      summary={<span className={data.open.length ? "text-neon" : ""}>{data.open.length ? `${data.open.length} open` : "All clear"}</span>}
      defaultOpen={data.open.length > 0}
    >
      <p className="text-[12.5px] text-muted">Every time an API goes down it&apos;s saved here, so you can come back with a new key.</p>
      <div className="mt-3 flex flex-col gap-2">
        {data.open.length ? (
          data.open.map((i) => <IssueRow key={i.id} issue={i} onSaved={load} />)
        ) : (
          <p className="text-[13px] text-muted">Nothing down right now.</p>
        )}
      </div>

      {data.history.length > 0 && (
        <details className="mt-3 text-xs text-neutral-500">
          <summary className="cursor-pointer select-none font-medium text-neutral-600">History ({data.history.length})</summary>
          <ul className="mt-2 flex flex-col gap-1.5">
            {data.history.map((i) => (
              <li key={i.id} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
                <span className="font-medium text-neutral-700">{i.title}</span>
                <span className="text-neutral-400">
                  · {new Date(i.firstSeen).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · down{" "}
                  {duration(i.firstSeen, i.resolvedAt!)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Section>
  );
}
