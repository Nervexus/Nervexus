"use client";

import { useEffect, useState } from "react";
import { GsapEntrance } from "@/components/GsapEntrance";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { SidebarCard } from "@/components/SidebarCard";

type Step = { id: string; text: string };
type Oil = { id: string; name: string; notes: string | null; day: boolean; night: boolean; cold: boolean };
type Pick = { oil: Oil | null; why: string };
type Plan = { when: string; title: string; kind: "shift" | "booking" | "trip"; pick: Pick };
type Day = {
  date: string;
  label: string;
  shift: { start: string; end: string; location: string | null } | null;
  morning: Step[];
  night: Step[];
  block: { title: string; detail: string; when: string } | null;
  hair: { headline: string; detail: string };
  wear: Pick;
  today: string[];
  tomorrow: { shift: string | null; items: string[]; alarm: string | null };
};
type KeyDate = { date: string; label: string; items: string[]; daysAway: number };
type Outreach = {
  today: { sent: number; replies: number };
  week: { sent: number; replies: number; callsBooked: number; won: number };
  warmLeads: { id: string | number; name: string; company: string | null }[];
};

const PANEL = "card card-pad";
const LABEL = "label";
const INPUT = "input";

// Ticks are a per-device convenience, kept per day so they reset each morning.
function readTicks(date: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(`routine:${date}`) ?? "{}");
  } catch {
    return {};
  }
}
function writeTicks(date: string, ticks: Record<string, boolean>) {
  try {
    localStorage.setItem(`routine:${date}`, JSON.stringify(ticks));
  } catch {
    // private mode etc. -- ticks just won't persist
  }
}

export default function RoutinePage() {
  const [which, setWhich] = useState<"today" | "tomorrow">("today");
  const [day, setDay] = useState<Day | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [keyDates, setKeyDates] = useState<KeyDate[]>([]);
  const [outreach, setOutreach] = useState<Outreach | null>(null);
  const [oils, setOils] = useState<Oil[]>([]);
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", notes: "", day: false, night: false, cold: false });

  function load(w = which) {
    fetch(`/api/routine?day=${w}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDay(data.day);
        setPlans(data.plans ?? []);
        setKeyDates(data.keyDates ?? []);
        setOutreach(data.outreach ?? null);
        setOils(data.oils ?? []);
        setTicks(readTicks(data.day.date));
      })
      .catch(() => setError("Couldn't load the routine."));
  }

  useEffect(() => load("today"), []); // eslint-disable-line react-hooks/exhaustive-deps

  function switchDay(w: "today" | "tomorrow") {
    setWhich(w);
    load(w);
  }

  function toggle(id: string) {
    if (!day) return;
    const next = { ...ticks, [id]: !ticks[id] };
    setTicks(next);
    writeTicks(day.date, next);
  }

  async function addOil() {
    if (!draft.name.trim()) return;
    const res = await fetch("/api/fragrances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      setDraft({ name: "", notes: "", day: false, night: false, cold: false });
      load();
    }
  }

  async function toggleOil(oil: Oil, k: "day" | "night" | "cold") {
    await fetch(`/api/fragrances/${oil.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [k]: !oil[k] }),
    });
    load();
  }

  async function removeOil(id: string) {
    await fetch(`/api/fragrances/${id}`, { method: "DELETE" });
    load();
  }

  const checklist = (title: string, steps: Step[]) => {
    const done = steps.filter((s) => ticks[s.id]).length;
    return (
      <div className={`gsap-entrance ${PANEL}`}>
        <div className="flex items-center justify-between">
          <span className={LABEL}>{title}</span>
          <span className="font-mono text-[12px] tabular text-muted">
            {done}/{steps.length}
          </span>
        </div>
        <div className="progress mt-3">
          <span style={{ width: `${steps.length ? (done / steps.length) * 100 : 0}%` }} />
        </div>
        <ul className="mt-3 flex flex-col gap-0.5">
          {steps.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => toggle(s.id)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[14px] transition-colors hover:bg-white/[0.03]"
              >
                <span
                  className={`check ${ticks[s.id] ? "is-on" : ""}`}
                >
                  {ticks[s.id] && (
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M2.5 6.5l2.2 2L9.5 3.5" />
                    </svg>
                  )}
                </span>
                <span className={ticks[s.id] ? "text-neutral-600 line-through" : "text-neutral-200"}>{s.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const flag = (on: boolean, label: string, onClick?: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={`tag transition-opacity ${on ? "tag-purple" : "opacity-60 hover:opacity-100"}`}
    >
      {label}
    </button>
  );

  return (
    <GsapEntrance className="relative mx-auto max-w-5xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance flex flex-wrap items-center gap-3">
        <h1 className="page-title">Routine</h1>
        <Pill>{day?.label ?? "…"}</Pill>
        <div className="tabs ml-auto">
          {(["today", "tomorrow"] as const).map((w) => (
            <button
              key={w}
              onClick={() => switchDay(w)}
              className={`tab capitalize ${which === w ? "is-active" : ""}`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <p className="gsap-entrance page-sub mt-1">
        skin, hair, scent and the work that moves things forward, fitted around your shifts
      </p>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {day && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className={`gsap-entrance ${PANEL}`}>
              <span className={LABEL}>The day</span>
              <p className="mt-2 text-[24px] font-medium tracking-tight text-text">
                {day.shift ? `Shift ${day.shift.start}–${day.shift.end}` : "No shift"}
                {day.shift?.location && <span className="text-neutral-500"> · {day.shift.location}</span>}
              </p>
              {day.today.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {day.today.map((t) => (
                    <span key={t} className="tag tag-purple">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {day.block ? (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-sm text-neutral-200">
                    {day.block.title} <span className="text-neutral-500">· {day.block.when}</span>
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">{day.block.detail}</p>
                </div>
              ) : (
                <p className="mt-5 border-t border-line pt-4 text-xs text-neutral-500">No work block today. Rest.</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {checklist("Morning", day.morning)}
              {checklist("Night", day.night)}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className={`gsap-entrance ${PANEL}`}>
                <span className={LABEL}>Hair &amp; beard</span>
                <p className="mt-3 text-sm text-neutral-200">{day.hair.headline}</p>
                <p className="mt-1 text-xs text-neutral-500">{day.hair.detail}</p>
              </div>
              <div className={`gsap-entrance ${PANEL}`}>
                <span className={LABEL}>Wear</span>
                <p className="mt-3 text-sm text-neutral-200">{day.wear.oil?.name ?? "Add your oils below"}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {day.wear.oil ? `${day.wear.why} ` : ""}1–2 dabs on moisturised wrists and neck, after you&apos;re dressed.
                </p>
              </div>
            </div>

            <div className={`gsap-entrance ${PANEL}`}>
              <span className={LABEL}>Scent for each plan · next 7 days</span>
              {plans.length === 0 ? (
                <p className="mt-3 text-xs text-neutral-500">Nothing on the rota or in bookings this week.</p>
              ) : (
                <ul className="mt-3 flex flex-col divide-y divide-line">
                  {plans.map((p, i) => (
                    <li key={i} className="flex items-center justify-between gap-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-neutral-200">{p.title}</p>
                        <p className="font-mono text-[10px] text-neutral-500">{p.when}</p>
                      </div>
                      <span className="shrink-0 text-right text-xs text-violet-200">{p.pick.oil?.name ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`gsap-entrance ${PANEL}`}>
              <span className={LABEL}>Your perfume oils · {oils.length}</span>
              <ul className="mt-3 flex flex-col divide-y divide-line">
                {oils.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-200">{o.name}</p>
                      {o.notes && <p className="text-xs text-neutral-500">{o.notes}</p>}
                    </div>
                    <div className="flex gap-1.5">
                      {flag(o.day, "day", () => toggleOil(o, "day"))}
                      {flag(o.night, "night", () => toggleOil(o, "night"))}
                      {flag(o.cold, "cold", () => toggleOil(o, "cold"))}
                    </div>
                    <button
                      onClick={() => removeOil(o.id)}
                      aria-label={`Remove ${o.name}`}
                      className="text-neutral-600 transition-colors hover:text-red-400"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Oil name"
                  className={INPUT}
                />
                <input
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  placeholder="Notes (oud, vanilla, fresh…)"
                  className={INPUT}
                />
              </div>
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                {flag(draft.day, "day", () => setDraft((d) => ({ ...d, day: !d.day })))}
                {flag(draft.night, "night", () => setDraft((d) => ({ ...d, night: !d.night })))}
                {flag(draft.cold, "cold", () => setDraft((d) => ({ ...d, cold: !d.cold })))}
                <Button variant="accent" onClick={addOil} disabled={!draft.name.trim()} className="ml-auto">
                  Add oil
                </Button>
              </div>
            </div>
          </div>

          <aside className="gsap-entrance flex flex-col gap-4">
            <SidebarCard title="Key dates">
              <ul className="flex flex-col gap-3">
                {keyDates.map((k) => (
                  <li key={k.date} className="item px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-lilac">{k.label}</span>
                      <span className="font-mono text-[10px] tabular-nums text-neutral-500">
                        {k.daysAway === 0 ? "today" : `${k.daysAway}d`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-300">{k.items.join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </SidebarCard>
            <SidebarCard title="Next day">
              <p className="text-sm text-neutral-200">{day.tomorrow.shift ? `Shift ${day.tomorrow.shift}` : "No shift"}</p>
              {day.tomorrow.alarm && <p className="mt-1 text-xs text-neutral-500">Alarm {day.tomorrow.alarm}</p>}
              {day.tomorrow.items.length > 0 && <p className="mt-1 text-xs text-neutral-500">{day.tomorrow.items.join(" · ")}</p>}
            </SidebarCard>
            {outreach && (
              <SidebarCard title="Outreach">
                <div className="grid grid-cols-2 gap-2">
                  <div className="item px-3 py-2.5">
                    <p className="stat-num !text-[26px]">{outreach.today.sent}</p>
                    <p className="text-[12px] text-muted">sent today</p>
                  </div>
                  <div className="item px-3 py-2.5">
                    <p className="stat-num !text-[26px] text-lilac">{outreach.today.replies}</p>
                    <p className="text-[12px] text-muted">replies today</p>
                  </div>
                </div>
                <p className="mt-3 text-[12px] text-muted">
                  This week: {outreach.week.sent} sent · {outreach.week.replies} {outreach.week.replies === 1 ? "reply" : "replies"} · {outreach.week.callsBooked} {outreach.week.callsBooked === 1 ? "call" : "calls"} · {outreach.week.won} won
                </p>
                {outreach.warmLeads.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {outreach.warmLeads.slice(0, 6).map((l) => (
                      <span key={l.id} className="tag tag-purple">{l.company || l.name}</span>
                    ))}
                  </div>
                )}
                <a href="https://signal-outreach-two.vercel.app" target="_blank" rel="noopener noreferrer" className="btn mt-4 w-full">
                  Open outreach
                </a>
              </SidebarCard>
            )}
            <SidebarCard title="On Telegram">
              <p className="text-xs leading-relaxed text-neutral-500">
                Morning summary and night checklist arrive each day. Text /morning or /night any time.
              </p>
            </SidebarCard>
          </aside>
        </div>
      )}
    </GsapEntrance>
  );
}
