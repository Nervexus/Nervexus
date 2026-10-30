"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/NavIcon";

type SystemNode = {
  id: string;
  name: string;
  url: string | null;
  status: "online" | "offline" | "unconfigured";
  stats?: Record<string, unknown>;
};

export default function HubPage() {
  const [nodes, setNodes] = useState<SystemNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hub")
      .then((r) => r.json())
      .then((d) => setNodes(d.nodes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const encrypted = nodes.find((n) => n.id === "encrypted");
  const telegram = nodes.find((n) => n.id === "telegram");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-[26px]">
      <h1 className="text-[22px] font-semibold text-text">System</h1>
      <p className="mt-1 text-[13px] text-muted">
        Laura is the HQ. Everything connects here.
      </p>

      {/* Hub diagram */}
      <div className="relative mt-8 overflow-hidden rounded-[22px] border border-line bg-[#0a0a0a]">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden
        />

        <div className="relative flex flex-col items-center px-6 py-12 sm:py-16">
          {/* Top node — Encrypted */}
          <button
            onClick={() => encrypted?.url && window.open(encrypted.url, "_blank")}
            disabled={!encrypted?.url}
            className="group relative z-10 flex flex-col items-center gap-3"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-line-2 bg-[#111] shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all group-hover:border-accent/40 group-hover:shadow-[0_4px_24px_rgba(139,111,212,0.15)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-muted group-hover:text-accent" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2" />
              </svg>
            </div>
            <span className="rounded-full border border-line bg-[#111] px-3.5 py-1 text-[11px] font-semibold tracking-wider text-muted uppercase transition-colors group-hover:border-accent/30 group-hover:text-accent">
              Encrypted
            </span>
          </button>

          {/* Connection line top */}
          <div className="h-10 w-px bg-gradient-to-b from-line-2 to-line" aria-hidden />

          {/* Central Laura node */}
          <div className="relative z-10">
            {/* Glow ring */}
            <div className="absolute -inset-3 rounded-[24px] bg-accent/5 blur-xl" aria-hidden />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[22px] border border-line-2 bg-gradient-to-b from-[#151515] to-[#0e0e0e] shadow-[0_8px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]">
              {/* Inner highlight */}
              <div className="absolute inset-[6px] rounded-[16px] border border-line bg-gradient-to-b from-[#131313] to-[#0c0c0c]" aria-hidden />
              <LogoMark className="relative h-8 w-8" />
            </div>
          </div>

          {/* Horizontal arms */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg viewBox="0 0 400 200" className="h-[200px] w-[400px]" fill="none" aria-hidden>
              {/* Left arm to Stats */}
              <path d="M200 100 H80 V50" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <circle cx="80" cy="50" r="3" fill="rgba(255,255,255,0.1)" />
              {/* Right arm to API */}
              <path d="M200 100 H320 V50" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <circle cx="320" cy="50" r="3" fill="rgba(255,255,255,0.1)" />
              {/* Left arm to Leads */}
              <path d="M200 100 H80 V150" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <circle cx="80" cy="150" r="3" fill="rgba(255,255,255,0.1)" />
              {/* Right arm to Activity */}
              <path d="M200 100 H320 V150" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <circle cx="320" cy="150" r="3" fill="rgba(255,255,255,0.1)" />
            </svg>
          </div>

          {/* Connection line bottom */}
          <div className="h-10 w-px bg-gradient-to-b from-line to-line-2" aria-hidden />

          {/* Bottom node — Telegram */}
          <div className="group relative z-10 flex flex-col items-center gap-3">
            <span className="rounded-full border border-line bg-[#111] px-3.5 py-1 text-[11px] font-semibold tracking-wider text-muted uppercase">
              Telegram
            </span>
            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-line-2 bg-[#111] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-muted" aria-hidden>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
          </div>

          {/* Labels on the arms (desktop) */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block" aria-hidden>
            <span className="absolute -left-[120px] -top-[52px] rounded-md border border-line bg-[#111] px-2.5 py-1 text-[10px] font-medium tracking-wider text-dim uppercase">
              Stats
            </span>
            <span className="absolute -right-[110px] -top-[52px] rounded-md border border-line bg-[#111] px-2.5 py-1 text-[10px] font-medium tracking-wider text-dim uppercase">
              API
            </span>
            <span className="absolute -left-[120px] top-[36px] rounded-md border border-line bg-[#111] px-2.5 py-1 text-[10px] font-medium tracking-wider text-dim uppercase">
              Leads
            </span>
            <span className="absolute -right-[128px] top-[36px] rounded-md border border-line bg-[#111] px-2.5 py-1 text-[10px] font-medium tracking-wider text-dim uppercase">
              Activity
            </span>
          </div>
        </div>
      </div>

      {/* System cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Encrypted card */}
        <div className="card card-pad">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line-2 bg-[#0e0e0e]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-text">Encrypted</h2>
                <p className="text-[11px] text-dim">Signal Outreach</p>
              </div>
            </div>
            <StatusDot status={loading ? null : encrypted?.status ?? "unconfigured"} />
          </div>

          {encrypted?.stats && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="Sent today" value={encrypted.stats.sentToday} />
              <Stat label="Replies" value={encrypted.stats.repliesToday} />
              <Stat label="Warm leads" value={encrypted.stats.warmLeads} />
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <a
              href={encrypted?.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="btn flex-1 justify-center text-[12px]"
            >
              Open Encrypted
            </a>
          </div>
        </div>

        {/* Telegram card */}
        <div className="card card-pad">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line-2 bg-[#0e0e0e]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted" aria-hidden>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-text">Telegram</h2>
                <p className="text-[11px] text-dim">@Laura1xbot</p>
              </div>
            </div>
            <StatusDot status={loading ? null : telegram?.status ?? "unconfigured"} />
          </div>

          <p className="mt-4 text-[12px] text-muted leading-relaxed">
            Two-way messaging, daily texts, rota photos, file attachments.
          </p>

          <div className="mt-4">
            <a
              href="https://t.me/Laura1xbot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn inline-flex justify-center text-[12px]"
            >
              Open in Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: "online" | "offline" | "unconfigured" | null }) {
  if (!status) return <span className="h-2.5 w-2.5 rounded-full bg-dim/40 animate-pulse" />;
  const color =
    status === "online"
      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
      : status === "offline"
        ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]"
        : "bg-dim/40";
  const label = status === "online" ? "Connected" : status === "offline" ? "Offline" : "Not set up";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium text-dim uppercase tracking-wider">{label}</span>
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-line bg-[#0e0e0e] px-2.5 py-2 text-center">
      <p className="text-[16px] font-semibold text-text tabular-nums">{String(value ?? 0)}</p>
      <p className="mt-0.5 text-[10px] text-dim">{label}</p>
    </div>
  );
}
