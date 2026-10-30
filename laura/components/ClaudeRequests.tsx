"use client";

import { useEffect, useState } from "react";

type Req = { id: string; kind: string; summary: string; details: string | null; status: string; createdAt: string };

/** Settings > For Claude Code: things Laura has passed on for the developer chat. */
export function ClaudeRequests() {
  const [items, setItems] = useState<Req[]>([]);
  const [copied, setCopied] = useState(false);

  function load() {
    fetch("/api/requests")
      .then((r) => r.json())
      .then((d) => setItems(d.requests ?? []))
      .catch(() => {});
  }
  useEffect(load, []);

  const open = items.filter((i) => i.status === "open");

  async function copyAll() {
    const text =
      "Requests from Laura:\n\n" +
      open.map((r, n) => `${n + 1}. [${r.kind}] ${r.summary}${r.details ? `\n   ${r.details.replace(/\n/g, "\n   ")}` : ""}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked -- the list is still on screen to copy by hand
    }
  }

  async function setStatus(id: string, status: "open" | "done") {
    await fetch(`/api/requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/requests/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-text">For Claude Code</h2>
          <p className="text-[12.5px] text-muted">
            Things Laura has passed on. Tell her &ldquo;pass this to Claude&rdquo;, then copy these into the developer chat.
          </p>
        </div>
        <button onClick={copyAll} disabled={open.length === 0} className="btn btn-primary shrink-0">
          {copied ? "Copied" : `Copy all${open.length ? ` (${open.length})` : ""}`}
        </button>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {items.length === 0 && <li className="text-[13px] text-dim">Nothing yet.</li>}
        {items.map((r) => (
          <li key={r.id} className={`item px-3.5 py-3 ${r.status === "done" ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-2">
              <span className={`tag ${r.kind === "bug" ? "tag-red" : r.kind === "note" ? "" : "tag-purple"}`}>{r.kind}</span>
              <div className="min-w-0 flex-1">
                <p className={`text-[13.5px] text-text ${r.status === "done" ? "line-through" : ""}`}>{r.summary}</p>
                {r.details && <p className="mt-0.5 whitespace-pre-wrap text-[12.5px] text-muted">{r.details}</p>}
              </div>
              <button onClick={() => setStatus(r.id, r.status === "done" ? "open" : "done")} className="btn-ghost !px-2 !py-1 !text-[12px]">
                {r.status === "done" ? "Reopen" : "Done"}
              </button>
              <button onClick={() => remove(r.id)} aria-label="Delete" className="btn-ghost !px-1.5 !py-1 hover:!text-[#ff9a90]">
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
