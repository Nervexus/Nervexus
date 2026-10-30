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

type WebhookInfo = {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
} | null;

export default function HubPage() {
  const [nodes, setNodes] = useState<SystemNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhook, setWebhook] = useState<WebhookInfo>(null);
  const [webhookLoading, setWebhookLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);

  useEffect(() => {
    fetch("/api/hub")
      .then((r) => r.json())
      .then((d) => setNodes(d.nodes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/telegram/connect")
      .then((r) => r.json())
      .then((d) => setWebhook(d.url ? d : null))
      .catch(() => {})
      .finally(() => setWebhookLoading(false));
  }, []);

  async function setupWebhook() {
    setSettingUp(true);
    try {
      const res = await fetch("/api/telegram/connect", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setWebhook({ url: data.webhook_url, has_custom_certificate: false, pending_update_count: 0 });
      } else {
        alert(data.error || data.description || "Setup failed");
      }
    } catch {
      alert("Network error");
    } finally {
      setSettingUp(false);
    }
  }

  const encrypted = nodes.find((n) => n.id === "encrypted");
  const telegram = nodes.find((n) => n.id === "telegram");
  const vercelNode = nodes.find((n) => n.id === "vercel");
  const dbNode = nodes.find((n) => n.id === "database");
  const googleNode = nodes.find((n) => n.id === "google");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-[26px]">
      <h1 className="text-[22px] font-semibold text-text">System</h1>
      <p className="mt-1 text-[13px] text-muted">
        Laura is the HQ. Everything connects here.
      </p>

      {/* Hub diagram */}
      <div className="relative mt-8 overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.06)]">

        <div className="relative px-6 py-12 sm:px-12 sm:py-16">
          {/* Three-column layout: left pair | center orb | right pair */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            {/* Left column */}
            <div className="flex flex-col items-center gap-8">
              <NodeBox
                icon={<VercelIcon />}
                label="Vercel"
                status={loading ? null : vercelNode?.status ?? "online"}
              />
              <NodeBox
                icon={<DatabaseIcon />}
                label="Database"
                status={loading ? null : dbNode?.status ?? "online"}
              />
            </div>

            {/* Central Laura node */}
            <div className="relative shrink-0">
              <div className="absolute -inset-5 rounded-full bg-accent/[0.06] blur-2xl" aria-hidden />
              <div className="absolute -inset-1.5 rounded-full border border-accent/15" aria-hidden />
              <div className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full border border-accent/20 bg-gradient-to-b from-white to-surface-2 shadow-[0_4px_16px_rgba(139,111,212,0.1),0_1px_3px_rgba(0,0,0,0.04)]">
                <LogoMark className="h-8 w-8" />
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col items-center gap-8">
              <NodeBox
                icon={<GlobeIcon />}
                label="Encrypted"
                status={loading ? null : encrypted?.status ?? "unconfigured"}
                onClick={() => encrypted?.url && window.open(encrypted.url, "_blank")}
              />
              <NodeBox
                icon={<MessageIcon />}
                label="Telegram"
                status={loading ? null : telegram?.status ?? "unconfigured"}
                onClick={() => window.open("https://t.me/Laura1xbot", "_blank")}
              />
              <NodeBox
                icon={<GoogleIcon />}
                label="Google"
                status={loading ? null : googleNode?.status ?? "unconfigured"}
              />
            </div>
          </div>

          {/* SVG curved connections overlaying the layout */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden
          >
            {/* Centre → top-left (Vercel) */}
            <path d="M50,50 C35,50 30,28 15,28" stroke="rgba(0,0,0,0.08)" strokeWidth="0.3" />
            <circle cx="15" cy="28" r="0.7" fill="rgba(139,111,212,0.3)" />
            {/* Centre → bottom-left (Database) */}
            <path d="M50,50 C35,50 30,72 15,72" stroke="rgba(0,0,0,0.08)" strokeWidth="0.3" />
            <circle cx="15" cy="72" r="0.7" fill="rgba(139,111,212,0.3)" />
            {/* Centre → top-right (Encrypted) */}
            <path d="M50,50 C65,45 70,35 85,35" stroke="rgba(0,0,0,0.08)" strokeWidth="0.3" />
            <circle cx="85" cy="35" r="0.7" fill="rgba(139,111,212,0.3)" />
            {/* Centre → bottom-right (Telegram) */}
            <path d="M50,50 C65,50 70,60 85,60" stroke="rgba(0,0,0,0.08)" strokeWidth="0.3" />
            <circle cx="85" cy="60" r="0.7" fill="rgba(139,111,212,0.3)" />
            {/* Centre → far-bottom-right (Google) */}
            <path d="M50,50 C65,55 70,82 85,82" stroke="rgba(0,0,0,0.08)" strokeWidth="0.3" />
            <circle cx="85" cy="82" r="0.7" fill="rgba(139,111,212,0.3)" />
          </svg>
        </div>
      </div>

      {/* System cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Encrypted card */}
        <div className="card card-pad">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line bg-surface-2 text-muted">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line bg-surface-2 text-muted">
                <MessageIcon />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-text">Telegram</h2>
                <p className="text-[11px] text-dim">@Laura1xbot</p>
              </div>
            </div>
            <StatusDot status={loading ? null : telegram?.status ?? "unconfigured"} />
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${webhookLoading ? "bg-dim/40 animate-pulse" : webhook?.url ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.3)]"}`} />
              <span className="text-[12px] text-muted">
                {webhookLoading ? "Checking webhook…" : webhook?.url ? "Webhook active" : "Webhook not connected"}
              </span>
            </div>
            {webhook?.last_error_message && (
              <p className="text-[11px] text-red-500/80">
                Last error: {webhook.last_error_message}
              </p>
            )}
            {webhook?.pending_update_count ? (
              <p className="text-[11px] text-amber-600/80">
                {webhook.pending_update_count} pending update{webhook.pending_update_count === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex gap-2">
            <a
              href="https://t.me/Laura1xbot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn flex-1 justify-center text-[12px]"
            >
              Open in Telegram
            </a>
            <button
              onClick={setupWebhook}
              disabled={settingUp}
              className="btn flex-1 justify-center text-[12px]"
            >
              {settingUp ? "Setting up…" : webhook?.url ? "Reconnect" : "Connect Webhook"}
            </button>
          </div>
        </div>

        {/* Google card */}
        <div className="card card-pad sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line bg-surface-2 text-muted">
                <GoogleIcon />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-text">Google</h2>
                <p className="text-[11px] text-dim">Calendar & Gmail</p>
              </div>
            </div>
            <StatusDot status={loading ? null : googleNode?.status ?? "unconfigured"} />
          </div>

          <div className="mt-4 space-y-2">
            {googleNode?.status === "online" && (
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                  <span className="text-[12px] text-muted">Calendar connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                  <span className="text-[12px] text-muted">Gmail connected</span>
                </div>
              </div>
            )}
            {googleNode?.status === "unconfigured" && (
              <p className="text-[12px] text-muted">
                Not connected. Visit <span className="font-medium text-text">/api/google/auth</span> to link your Google account.
              </p>
            )}
            {googleNode?.status === "offline" && (
              <p className="text-[12px] text-red-500/80">
                Credentials expired. Reconnect via /api/google/auth.
              </p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <a
              href="/api/google/auth"
              className="btn flex-1 justify-center text-[12px]"
            >
              {googleNode?.status === "online" ? "Reconnect" : "Connect Google"}
            </a>
          </div>
        </div>

      </div>
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
      <div className="relative flex h-[80px] w-[110px] flex-col items-center justify-center rounded-[14px] border border-line bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.06)] transition-all group-hover:border-line-2 group-hover:shadow-[0_2px_6px_rgba(0,0,0,0.06),0_8px_20px_-6px_rgba(0,0,0,0.08)] sm:h-[100px] sm:w-[150px]">
        {/* Icon */}
        <div className="flex h-8 w-8 items-center justify-center text-muted group-hover:text-text transition-colors sm:h-10 sm:w-10">
          {icon}
        </div>
        {/* Status dot */}
        {status && (
          <span
            className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
              status === "online"
                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                : status === "offline"
                  ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.3)]"
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
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden>
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10c2.76 0 5.26-1.12 7.07-2.93" />
      <path d="M22 12H12v4h5.74c-.77 2.12-2.81 3.64-5.24 3.96" />
      <path d="M12 8V2.18C7.86 2.56 4.56 5.86 4.18 10" />
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
      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
      : status === "offline"
        ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.3)]"
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
    <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-center">
      <p className="text-[16px] font-semibold text-text tabular-nums">{String(value ?? 0)}</p>
      <p className="mt-0.5 text-[10px] text-dim">{label}</p>
    </div>
  );
}
