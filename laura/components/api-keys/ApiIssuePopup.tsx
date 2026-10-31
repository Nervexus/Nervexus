"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IssueRow, OPEN_KEYS_TAB, toast, type Issue } from "@/components/api-keys/shared";

const POLL_MS = 30_000;

async function fetchOpen(): Promise<Issue[]> {
  const res = await fetch("/api/issues");
  const data = await res.json();
  return data.open ?? [];
}

/** Pops up on any page when an API is down. Shown once per page load per
 * issue; "Remind me later" snoozes it for 6 hours. */
export function ApiIssuePopup() {
  const router = useRouter();
  const shown = useRef(new Set<number>());
  const [ids, setIds] = useState<number[]>([]);
  const [rows, setRows] = useState<Issue[]>([]);
  const open = ids.length > 0;

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        // Only real outages pop up; a bad key with a working backup is listed in Settings.
        const list = (await fetchOpen()).filter((i) => i.kind === "down" && !i.snoozed && !shown.current.has(i.id));
        // Another pop-up is open: try again on the next poll.
        if (!alive || !list.length || document.querySelector(".modal")) return;
        list.forEach((i) => shown.current.add(i.id));
        setRows(list);
        setIds(list.map((i) => i.id));
      } catch {
        // offline or signed out: next poll
      }
    }
    void poll();
    const t = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  function close() {
    setIds([]);
    setRows([]);
  }

  async function refresh() {
    const still = (await fetchOpen()).filter((i) => ids.includes(i.id));
    if (!still.length) {
      close();
      toast("Fixed. Laura will carry on.");
    } else {
      setRows(still);
    }
  }

  async function later() {
    await fetch("/api/issues/snooze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, hours: 6 }),
    }).catch(() => {});
    close();
    toast("OK. I'll remind you in 6 hours. It stays listed in Settings.");
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="modal-backdrop absolute inset-0" onClick={close} aria-hidden />
      <div role="dialog" aria-modal="true" className="modal relative max-h-[85vh] w-full max-w-md overflow-y-auto !bg-white">
        <div className="flex items-center gap-3">
          <span className="icon-tile is-alert !h-10 !w-10">
            <iconify-icon icon="solar:danger-triangle-linear" className="text-lg" />
          </span>
          <h2 className="text-lg font-semibold text-neutral-900">
            {rows.length === 1 ? "An API is down" : `${rows.length} API problems`}
          </h2>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          This step is skipped until it&apos;s fixed. It&apos;s saved under Settings → API keys, so you can come back to it any time.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {rows.map((i) => (
            <IssueRow key={i.id} issue={i} onSaved={refresh} />
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={later} className="btn-ghost">
            Remind me later
          </button>
          <button
            onClick={() => {
              close();
              router.push("/settings#api-keys");
              setTimeout(() => window.dispatchEvent(new Event(OPEN_KEYS_TAB)), 100);
            }}
            className="btn btn-primary"
          >
            Open API keys
          </button>
        </div>
      </div>
    </div>
  );
}
