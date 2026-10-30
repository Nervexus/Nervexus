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
  const vercelNode = nodes.find((n) => n.id === "vercel");
  const dbNode = nodes.find((n) => n.id === "database");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-[26px]">
      <h1 className="text-[22px] font-semibold text-text">System</h1>
      <p className="mt-1 text-[13px] text-muted">
        Laura is the HQ. Everything connects here.
      </p>

      {/* Hub diagram */}
      <div className="relative mt-8 overflow-hidden rounded-[22px] border border-line bg-[#080808]">
        {/* Number matrix background */}
        <NumberMatrix />

        <div className="relative flex items-center justify-center px-4 py-14 sm:px-10 sm:py-20">
          {/* SVG curved connection lines */}
          <svg
            viewBox="0 0 600 340"
            className="absolute inset-0 h-full w-full"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            {/* Laura → Encrypted (top-right) */}
            <path
              d="M200,170 C300,170 280,70 400,70"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.2"
            />
            <circle cx="400" cy="70" r="2.5" fill="rgba(139,111,212,0.4)" />
            <circle cx="200" cy="170" r="2.5" fill="rgba(139,111,212,0.3)" />

            {/* Laura → Telegram (bottom-right) */}
            <path
              d="M200,170 C300,170 280,270 400,270"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.2"
            />
            <circle cx="400" cy="270" r="2.5" fill="rgba(139,111,212,0.4)" />

            {/* Laura → Vercel (top-left) — curve goes up-left */}
            <path
              d="M200,170 C100,170 120,70 40,70"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.2"
            />
            <circle cx="40" cy="70" r="2.5" fill="rgba(139,111,212,0.4)" />

            {/* Laura → Database (bottom-left) — curve goes down-left */}
            <path
              d="M200,170 C100,170 120,270 40,270"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.2"
            />
            <circle cx="40" cy="270" r="2.5" fill="rgba(139,111,212,0.4)" />
          </svg>

          {/* Layout: 5-column grid — left nodes | gap | center | gap | right nodes */}
          <div className="relative z-10 grid w-full grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-y-6 sm:gap-x-4">

            {/* Top-left: Vercel */}
            <div className="col-start-1 row-start-1 flex justify-center">
              <NodeBox
                icon={<VercelIcon />}
                label="Vercel"
                status={loading ? null : vercelNode?.status ?? "online"}
              />
            </div>

            {/* Spacer */}
            <div className="col-start-2 row-span-2 row-start-1 hidden w-8 sm:block" />

            {/* Central Laura node */}
            <div className="col-start-3 row-span-2 row-start-1 flex justify-center">
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute -inset-4 rounded-full bg-[#d4a040]/10 blur-2xl" aria-hidden />
                <div className="absolute -inset-1 rounded-full border border-[#c89530]/20" aria-hidden />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#c89530]/30 bg-gradient-to-b from-[#151515] to-[#0a0a0a] shadow-[0_0_30px_rgba(200,149,48,0.12),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <LogoMark className="h-7 w-7" />
                </div>
              </div>
            </div>

            {/* Spacer */}
            <div className="col-start-4 row-span-2 row-start-1 hidden w-8 sm:block" />

            {/* Top-right: Encrypted */}
            <div className="col-start-5 row-start-1 flex justify-center">
              <NodeBox
                icon={<GlobeIcon />}
                label="Encrypted"
                status={loading ? null : encrypted?.status ?? "unconfigured"}
                onClick={() => encrypted?.url && window.open(encrypted.url, "_blank")}
              />
            </div>

            {/* Bottom-left: Database */}
            <div className="col-start-1 row-start-2 flex justify-center">
              <NodeBox
                icon={<DatabaseIcon />}
                label="Database"
                status={loading ? null : dbNode?.status ?? "online"}
              />
            </div>

            {/* Bottom-right: Telegram */}
            <div className="col-start-5 row-start-2 flex justify-center">
              <NodeBox
                icon={<MessageIcon />}
                label="Telegram"
                status={loading ? null : telegram?.status ?? "unconfigured"}
                onClick={() => window.open("https://t.me/Laura1xbot", "_blank")}
              />
            </div>
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
                <GlobeIcon />
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
                <MessageIcon />
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

        {/* Vercel card */}
        <div className="card card-pad">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line-2 bg-[#0e0e0e]">
                <VercelIcon />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-text">Vercel</h2>
                <p className="text-[11px] text-dim">Deployment</p>
              </div>
            </div>
            <StatusDot status={loading ? null : vercelNode?.status ?? "online"} />
          </div>

          <p className="mt-4 text-[12px] text-muted leading-relaxed">
            Production hosting, edge functions, automatic deployments.
          </p>

          <div className="mt-4">
            <a
              href="https://laura-lyart.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="btn inline-flex justify-center text-[12px]"
            >
              Open production
            </a>
          </div>
        </div>

        {/* Database card */}
        <div className="card card-pad">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line-2 bg-[#0e0e0e]">
                <DatabaseIcon />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-text">Database</h2>
                <p className="text-[11px] text-dim">Turso / libSQL</p>
              </div>
            </div>
            <StatusDot status={loading ? null : dbNode?.status ?? "online"} />
          </div>

          <p className="mt-4 text-[12px] text-muted leading-relaxed">
            Encrypted storage for notes, shifts, vault, routines and all data.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Number matrix (client-only random) ── */
function NumberMatrix() {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(
      Array.from({ length: 18 }, () =>
        Array.from({ length: 42 }, () => Math.floor(Math.random() * 10)).join("")
      ).join("\n")
    );
  }, []);
  if (!text) return null;
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.04] select-none" aria-hidden>
      <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-[1.6] text-white p-6">{text}</pre>
    </div>
  );
}

/* ── Node box used in the diagram ── */
function NodeBox({
  icon,
  label,
  status,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  status: "online" | "offline" | "unconfigured" | null;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className="group flex flex-col items-center gap-2"
    >
      <div className="relative flex h-[72px] w-[100px] flex-col items-center justify-center rounded-[14px] border border-line-2 bg-[#0e0e0e] shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all group-hover:border-line-3 sm:h-[88px] sm:w-[130px]">
        {/* Icon */}
        <div className="flex h-8 w-8 items-center justify-center text-muted group-hover:text-text transition-colors sm:h-10 sm:w-10">
          {icon}
        </div>
        {/* Status dot */}
        {status && (
          <span
            className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
              status === "online"
                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                : status === "offline"
                  ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]"
                  : "bg-dim/40"
            }`}
          />
        )}
      </div>
      <span className="text-[11px] font-medium text-dim group-hover:text-muted transition-colors">{label}</span>
    </Tag>
  );
}

/* ── Icons ── */
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2" />
    </svg>
  );
}
function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function VercelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden>
      <path d="M12 2L2 19.5h20L12 2z" />
    </svg>
  );
}
function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
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
