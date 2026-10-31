"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Empty, Group, Section } from "@/components/ui/layout";
import { KEYS_CHANGED, ago, inTime, toast } from "@/components/api-keys/shared";

type Key = {
  id: string;
  label: string;
  masked: string;
  status: "ok" | "limited" | "exhausted" | "invalid";
  until: string | null;
  error: string | null;
  info: Record<string, unknown>;
  lastUsed: string | null;
  uses: number;
  fromEnv: boolean;
};
type CatalogueEntry = { id: string; label: string; what: string; limits: string; how: readonly string[] };
type Service = {
  id: string;
  builtIn: boolean;
  label: string;
  what: string;
  limits: string;
  how: readonly string[];
  activeId: string | null;
  nextReset: string | null;
  keys: Key[];
};

const GREEN = "!border-green/20 !bg-green-soft !text-green";

function keyPill(k: Key, active: boolean): { text: string; tone: string } {
  const wait = inTime(k.until);
  if (k.status === "invalid") return { text: "Rejected", tone: "tag-red" };
  if (k.status === "exhausted") return { text: wait ? `Used up, resets in ${wait}` : "Used up", tone: "tag-amber" };
  if (k.status === "limited") return { text: wait ? `Rate-limited, back in ${wait}` : "Rate-limited", tone: "tag-amber" };
  return active ? { text: "In use", tone: GREEN } : { text: "Working", tone: "" };
}

/** Settings → API keys: problems, one collapsible Section per service, and "Add an API". */
export function ApiKeySettings({ problems }: { problems?: ReactNode }) {
  const [services, setServices] = useState<Service[] | null>(null);
  const [catalogue, setCatalogue] = useState<CatalogueEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/keys")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setServices(data.services ?? []);
        setCatalogue(data.catalogue ?? []);
        setError(null);
      })
      .catch(() => setError("Couldn't load API keys."));
  }

  useEffect(() => {
    load();
    window.addEventListener(KEYS_CHANGED, load);
    return () => window.removeEventListener(KEYS_CHANGED, load);
  }, []);

  return (
    <Group>
      {problems}
      {error && <Empty>{error}</Empty>}
      {!services && !error && <Empty>Loading…</Empty>}
      {services?.map((s) => <ServiceCard key={s.id} service={s} onState={setServices} />)}
      {services && <AddApiCard catalogue={catalogue} added={services.map((s) => s.id)} onState={setServices} />}
    </Group>
  );
}

function ServiceCard({ service, onState }: { service: Service; onState: (s: Service[]) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");

  const count = `${service.keys.length} key${service.keys.length === 1 ? "" : "s"}`;
  const header =
    service.keys.length === 0
      ? { text: "Not set up", tone: "" }
      : !service.activeId
        ? { text: `Down · ${count}`, tone: "text-neon" }
        : service.keys.some((k) => k.status !== "ok")
          ? { text: `Using a backup · ${count}`, tone: "text-[var(--amber)]" }
          : { text: `Working · ${count}`, tone: "" };

  async function act(id: string, path: string, init: RequestInit, done?: (r: { ok: boolean; message: string }) => void) {
    setBusy(id);
    try {
      const res = await fetch(path, init);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      if (data.services) onState(data.services);
      if (data.result) done?.(data.result);
      window.dispatchEvent(new Event(KEYS_CHANGED));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong.", true);
    } finally {
      setBusy(null);
    }
  }

  function add() {
    if (!apiKey.trim()) return toast("Paste a key first.", true);
    act(
      "add",
      "/api/keys",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: service.id, key: apiKey.trim(), label: label.trim() }),
      },
      (r) => {
        toast(r.ok ? `Key added and working.` : `Key added but not working: ${r.message}`, !r.ok);
        if (r.ok) {
          setApiKey("");
          setLabel("");
        }
      }
    );
  }

  return (
    <Section
      title={service.label}
      icon={service.builtIn ? "solar:cpu-bolt-linear" : "solar:key-linear"}
      summary={<span className={header.tone}>{header.text}</span>}
    >
      <p className="text-xs leading-relaxed text-neutral-500">
        {service.what} {service.limits}
      </p>

      <div className="mt-2 flex flex-col">
        {service.keys.length === 0 && <p className="px-1 text-xs text-neutral-500">No key yet.</p>}
        {service.keys.map((k) => {
          const active = k.id === service.activeId;
          const pill = keyPill(k, active);
          const info = Object.entries(k.info).map(([name, v]) => `${name.replace(/_/g, " ")}: ${String(v)}`);
          return (
            <div key={k.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[rgba(20,18,24,0.06)] py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {k.label}
                  {k.fromEnv && <span className="ml-1.5 text-[11px] font-normal text-neutral-400">set in Vercel</span>}
                </p>
                <p className="truncate font-mono text-[11px] text-neutral-400">{k.masked}</p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  {k.uses} {k.uses === 1 ? "use" : "uses"} · last used {ago(k.lastUsed)}
                  {info.length ? ` · ${info.join(" · ")}` : ""}
                </p>
                {k.error && k.status !== "ok" && <p className="mt-0.5 text-[11px] text-red-400">{k.error}</p>}
              </div>
              <span className={`tag shrink-0 ${pill.tone}`}>{pill.text}</span>
              <div className="flex w-full items-center justify-end gap-1 sm:w-auto">
                {!active && (
                  <button
                    onClick={() => act(k.id, `/api/keys/${k.id}/activate`, { method: "POST" }, undefined)}
                    disabled={busy !== null}
                    className="btn-ghost !px-2.5 !py-1 text-xs"
                  >
                    Use this key
                  </button>
                )}
                <button
                  onClick={() =>
                    act(k.id, `/api/keys/${k.id}/test`, { method: "POST" }, (r) =>
                      toast(r.ok ? `${k.label}: working.` : `${k.label}: ${r.message}`, !r.ok)
                    )
                  }
                  disabled={busy !== null}
                  className="btn-ghost !px-2.5 !py-1 text-xs"
                >
                  {busy === k.id ? "Testing…" : "Test"}
                </button>
                {!k.fromEnv && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${k.label}"?`)) {
                        act(k.id, `/api/keys/${k.id}`, { method: "DELETE" }, undefined);
                        toast("Key removed.");
                      }
                    }}
                    disabled={busy !== null}
                    aria-label={`Remove ${k.label}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white hover:text-red-400"
                  >
                    <iconify-icon icon="solar:trash-bin-2-linear" className="text-base" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="label mt-4">Add backup key</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`Paste a${service.keys.length ? " backup" : "n"} ${service.label} key`}
          type="password"
          autoComplete="off"
          className="input flex-1 font-mono text-sm placeholder:font-sans"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="input text-sm sm:max-w-[150px]"
        />
        <button onClick={add} disabled={busy !== null} className="btn btn-primary shrink-0">
          {busy === "add" ? "Testing…" : "Save & test"}
        </button>
      </div>

      <details className="mt-3 text-xs text-neutral-500">
        <summary className="cursor-pointer select-none font-medium text-neutral-600">How to get a {service.label} key</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {service.how.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-2">{service.limits}</p>
      </details>
    </Section>
  );
}

const CUSTOM = "custom";

/** Add a key for any other service: one from the catalogue, or a custom one by name. */
function AddApiCard({
  catalogue,
  added,
  onState,
}: {
  catalogue: CatalogueEntry[];
  added: string[];
  onState: (s: Service[]) => void;
}) {
  const [service, setService] = useState(catalogue[0]?.id ?? CUSTOM);
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const picked = catalogue.find((c) => c.id === service);

  async function save() {
    if (service === CUSTOM && !name.trim()) return toast("Give the API a name.", true);
    if (!apiKey.trim()) return toast("Paste a key first.", true);
    setBusy(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, name: name.trim(), key: apiKey.trim(), label: label.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save that key.");
      onState(data.services);
      const ok = data.result?.ok !== false;
      toast(ok ? `${picked?.label ?? name.trim()} added. ${data.result?.message ?? ""}` : `Added but not working: ${data.result?.message}`, !ok);
      if (ok) {
        setApiKey("");
        setLabel("");
        setName("");
      }
      window.dispatchEvent(new Event(KEYS_CHANGED));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save that key.", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Add an API" icon="solar:add-circle-linear" summary="Google Places, OpenAI…">
      <p className="text-xs text-neutral-500">Store keys for other services. Each one gets its own section with backups.</p>

      <div className="mt-3 flex flex-col gap-2">
        <select value={service} onChange={(e) => setService(e.target.value)} className="input text-sm">
          {catalogue.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
              {added.includes(c.id) ? " (added, adds a backup)" : ""}
            </option>
          ))}
          <option value={CUSTOM}>Other (custom API)</option>
        </select>
        {service === CUSTOM && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="API name, e.g. Spotify" maxLength={40} className="input text-sm" />
        )}
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste the API key"
          type="password"
          autoComplete="off"
          className="input font-mono text-sm placeholder:font-sans"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" className="input flex-1 text-sm" />
          <button onClick={save} disabled={busy} className="btn btn-primary shrink-0">
            {busy ? "Testing…" : "Save & test"}
          </button>
        </div>
      </div>

      {picked ? (
        <details className="mt-3 text-xs text-neutral-500">
          <summary className="cursor-pointer select-none font-medium text-neutral-600">How to get a {picked.label} key</summary>
          <p className="mt-2">{picked.what}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {picked.how.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-2">{picked.limits}</p>
        </details>
      ) : (
        <p className="mt-3 text-xs text-neutral-500">Custom keys are stored encrypted but can&apos;t be tested, so they&apos;re saved as working.</p>
      )}
    </Section>
  );
}
