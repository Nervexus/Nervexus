"use client";

import { useEffect, useState } from "react";
import { GsapEntrance } from "@/components/GsapEntrance";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { Group, PageHeader, Row, Section } from "@/components/ui/layout";

type Slot = "morning" | "afternoon" | "night";
type Step = { id: string; text: string; product: string | null; link: string | null; owned: boolean; auto?: boolean };
type Item = { id: string; slot: Slot; text: string; product: string | null; link: string | null; owned: boolean; days: string | null };
type Oil = { id: string; name: string; notes: string | null; day: boolean; night: boolean; cold: boolean };
type Pick = { oil: Oil | null; why: string };
type Plan = { when: string; title: string; kind: "shift" | "booking" | "trip"; pick: Pick };
type Day = {
  date: string;
  label: string;
  shift: { start: string; end: string; location: string | null } | null;
  morning: Step[];
  afternoon: Step[];
  night: Step[];
  shopping: { product: string; link: string | null }[];
  hair: { headline: string; detail: string };
  wear: Pick;
  today: string[];
};
type WeekDay = {
  date: string;
  label: string;
  shift: { start: string; end: string; colleagues: string | null; location: string | null } | null;
  block: { title: string; detail: string; when: string } | null;
  items: string[];
};
type KeyDate = { date: string; label: string; items: string[]; daysAway: number };
type Outreach = {
  today: { sent: number; replies: number };
  week: { sent: number; replies: number; callsBooked: number; won: number };
  warmLeads: { id: string | number; name: string; company: string | null }[];
};

const SLOTS: { slot: Slot; title: string; hint: string }[] = [
  { slot: "morning", title: "Morning", hint: "Until 12pm" },
  { slot: "afternoon", title: "Afternoon", hint: "12pm – 5pm" },
  { slot: "night", title: "Night", hint: "From 5pm" },
];

/** Which card is "now", by UK time: morning till 12, afternoon till 5, then night. */
function currentSlot(): Slot {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "night";
}

function readView(): "now" | "all" {
  try {
    return localStorage.getItem("routine:view") === "all" ? "all" : "now";
  } catch {
    return "now";
  }
}
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

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

function daysLabel(days: string | null): string {
  if (!days) return "Every day";
  return days
    .split(",")
    .map((d) => WEEKDAY_NAMES[Number(d)])
    .join(", ");
}

export default function RoutinePage() {
  const [which, setWhich] = useState<"today" | "tomorrow">("today");
  const [day, setDay] = useState<Day | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [week, setWeek] = useState<WeekDay[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [keyDates, setKeyDates] = useState<KeyDate[]>([]);
  const [oils, setOils] = useState<Oil[]>([]);
  const [outreach, setOutreach] = useState<Outreach | null>(null);
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Slot | null>(null);
  const [view, setView] = useState<"now" | "all">("now");
  const [nowSlot, setNowSlot] = useState<Slot>("morning");
  const [error, setError] = useState<string | null>(null);
  const [oilDraft, setOilDraft] = useState({ name: "", notes: "", day: false, night: false, cold: false });

  function load(w = which) {
    fetch(`/api/routine?day=${w}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDay(data.day);
        setItems(data.items ?? []);
        setWeek(data.week ?? []);
        setPlans(data.plans ?? []);
        setKeyDates(data.keyDates ?? []);
        setOils(data.oils ?? []);
        setOutreach(data.outreach ?? null);
        setTicks(readTicks(data.day.date));
        setNowSlot(currentSlot());
        setView(readView());
      })
      .catch(() => setError("Couldn't load the routine."));
  }

  useEffect(() => load("today"), []); // eslint-disable-line react-hooks/exhaustive-deps

  function switchView(v: "now" | "all") {
    setView(v);
    try {
      localStorage.setItem("routine:view", v);
    } catch {
      // remembered for this visit only
    }
  }

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

  async function saveItem(id: string, patch: Partial<Omit<Item, "days">> & { days?: number[] }) {
    await fetch(`/api/routine/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  async function removeItem(id: string) {
    await fetch(`/api/routine/items/${id}`, { method: "DELETE" });
    load();
  }

  async function addItem(slot: Slot, draft: NewItem) {
    const res = await fetch("/api/routine/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, ...draft }),
    });
    if (res.ok) load();
    return res.ok;
  }

  async function addOil() {
    if (!oilDraft.name.trim()) return;
    const res = await fetch("/api/fragrances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(oilDraft),
    });
    if (res.ok) {
      setOilDraft({ name: "", notes: "", day: false, night: false, cold: false });
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

  const flag = (on: boolean, label: string, onClick?: () => void) => (
    <button type="button" onClick={onClick} className={`tag transition-opacity ${on ? "tag-purple" : "opacity-60 hover:opacity-100"}`}>
      {label}
    </button>
  );

  // Tomorrow is a plan, so it always shows the whole day.
  const showAll = view === "all" || which === "tomorrow";
  const card = (slot: Slot, size: "large" | "normal") => {
    const meta = SLOTS.find((x) => x.slot === slot)!;
    return (
      <RoutineCard
        key={slot}
        size={size}
        title={meta.title}
        hint={meta.hint}
        current={which === "today" && slot === nowSlot}
        steps={day ? day[slot] : []}
        items={items.filter((i) => i.slot === slot)}
        ticks={ticks}
        onToggle={toggle}
        editing={editing === slot}
        onEdit={() => setEditing(editing === slot ? null : slot)}
        onSave={saveItem}
        onRemove={removeItem}
        onAdd={(draft) => addItem(slot, draft)}
      />
    );
  };

  const shiftDays = week.filter((d) => d.shift).length;
  const nextKey = keyDates[0];
  const otherSlots = SLOTS.filter((x) => x.slot !== nowSlot).map((x) => x.slot);

  return (
    <GsapEntrance className="relative mx-auto max-w-3xl px-4 pb-10 sm:px-[26px]">
      <div className="gsap-entrance">
        <PageHeader
          title="Routine"
          meta={
            <>
              <Pill>{day?.label ?? "…"}</Pill>
              {day && <span className="pill">{day.shift ? `Shift ${day.shift.start}–${day.shift.end}` : "Day off"}</span>}
            </>
          }
        />
        <div className="-mt-2 mb-6 flex flex-wrap gap-2">
          {which === "today" && (
            <div className="tabs">
              {(["now", "all"] as const).map((v) => (
                <button key={v} onClick={() => switchView(v)} className={`tab ${view === v ? "is-active" : ""}`}>
                  {v === "now" ? "Now" : "All day"}
                </button>
              ))}
            </div>
          )}
          <div className="tabs">
            {(["today", "tomorrow"] as const).map((w) => (
              <button key={w} onClick={() => switchDay(w)} className={`tab capitalize ${which === w ? "is-active" : ""}`}>
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="mb-6 text-sm text-red-400">{error}</p>}

      {day && (
        <div className="flex flex-col gap-6">
          {showAll ? (
            <div className="flex flex-col gap-4">
              {card("morning", "large")}
              {card("afternoon", "normal")}
              {card("night", "normal")}
            </div>
          ) : (
            card(nowSlot, "large")
          )}

          <Group className="gsap-entrance">
            {!showAll && (
              <Section title="Up next" summary={otherSlots.map((x) => SLOTS.find((m) => m.slot === x)!.title).join(" · ")}>
                <div className="flex flex-col divide-y divide-line">
                  {otherSlots.map((slot) => {
                    const meta = SLOTS.find((x) => x.slot === slot)!;
                    const steps = day[slot];
                    return (
                      <div key={slot} className="py-3 first:pt-0 last:pb-0">
                        <p className="flex items-center justify-between text-[13px]">
                          <span className="font-medium text-text">{meta.title}</span>
                          <span className="text-dim">{meta.hint}</span>
                        </p>
                        <ul className="mt-1.5 flex flex-col gap-1">
                          {steps.length === 0 && <li className="text-[12.5px] text-dim">Nothing planned.</li>}
                          {steps.map((st) => (
                            <li key={st.id} className="text-[12.5px] text-muted">
                              {st.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                  <button onClick={() => switchView("all")} className="btn-ghost mt-2 self-start !px-0 !text-[12.5px]">
                    Show all day
                  </button>
                </div>
              </Section>
            )}

            <Section
              title="Key dates"
              icon="solar:calendar-mark-linear"
              summary={nextKey ? `${nextKey.items[0] ?? nextKey.label} · ${nextKey.daysAway === 0 ? "today" : `${nextKey.daysAway}d`}` : "None"}
            >
              {keyDates.length === 0 && <p className="text-[13px] text-dim">No key dates coming up.</p>}
              {keyDates.map((k) => (
                <Row
                  key={k.date}
                  title={k.items.join(" · ")}
                  sub={k.label}
                  trailing={<span className="font-mono text-[11px] tabular text-dim">{k.daysAway === 0 ? "today" : `${k.daysAway}d`}</span>}
                />
              ))}
            </Section>

            <Section
              title="Work rota, next 7 days"
              icon="solar:case-minimalistic-linear"
              summary={shiftDays === 0 ? "Off all week" : plural(shiftDays, "shift")}
            >
              {week.map((d, i) => (
                <Row
                  key={d.date}
                  title={
                    <span className={i === 0 ? "font-medium" : ""}>
                      {i === 0 ? "Today" : d.label}
                    </span>
                  }
                  sub={
                    d.shift
                      ? `${d.shift.start}–${d.shift.end}${d.shift.colleagues ? ` · with ${d.shift.colleagues}` : ""}`
                      : "Off"
                  }
                  trailing={
                    (d.block || d.items.length > 0) && (
                      <span className="flex max-w-[180px] flex-wrap justify-end gap-1">
                        {d.block && (
                          <span className="tag">
                            <span className="h-1.5 w-1.5 rounded-full bg-neon" />
                            {d.block.title}
                          </span>
                        )}
                        {d.items.map((k) => (
                          <span key={k} className="tag">
                            <span className="h-1.5 w-1.5 rounded-full bg-neon" />
                            {k}
                          </span>
                        ))}
                      </span>
                    )
                  }
                />
              ))}
              <a href="/rota" className="btn-ghost mt-2 !px-0 !text-[12.5px]">
                Edit rota ›
              </a>
            </Section>

            <Section title="Hair & beard" icon="solar:scissors-linear" summary={day.hair.headline}>
              <p className="text-[14px] text-text">{day.hair.headline}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{day.hair.detail}</p>
            </Section>

            <Section title="Perfume oils" icon="solar:bottle-linear" summary={day.wear.oil ? `Wear ${day.wear.oil.name}` : plural(oils.length, "oil")}>
              <p className="text-[14px] text-text">{day.wear.oil ? `Wear ${day.wear.oil.name}` : "No oils added yet"}</p>
              <p className="mt-1.5 text-[13px] text-muted">
                {day.wear.oil ? day.wear.why : "1–2 dabs on moisturised wrists and neck, after you're dressed."}
              </p>
              {plans.length > 0 && day.wear.oil && (
                <ul className="mt-3 flex flex-col gap-1">
                  {plans.slice(0, 3).map((p, i) => (
                    <li key={i} className="flex justify-between gap-3 text-[12px]">
                      <span className="truncate text-muted">
                        {p.title} · {p.when}
                      </span>
                      <span className="shrink-0 text-lilac">{p.pick.oil?.name ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="mt-3 flex flex-col divide-y divide-line">
                {oils.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="min-w-0 flex-1 truncate text-[13px] text-text" title={o.notes ?? undefined}>
                      {o.name}
                    </span>
                    {flag(o.day, "day", () => toggleOil(o, "day"))}
                    {flag(o.night, "night", () => toggleOil(o, "night"))}
                    {flag(o.cold, "cold", () => toggleOil(o, "cold"))}
                    <button onClick={() => removeOil(o.id)} aria-label={`Remove ${o.name}`} className="btn-ghost !px-1.5 !py-0.5">
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-col gap-2">
                <input
                  value={oilDraft.name}
                  onChange={(e) => setOilDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Add an oil"
                  className="input"
                />
                {oilDraft.name.trim() && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {flag(oilDraft.day, "day", () => setOilDraft((d) => ({ ...d, day: !d.day })))}
                    {flag(oilDraft.night, "night", () => setOilDraft((d) => ({ ...d, night: !d.night })))}
                    {flag(oilDraft.cold, "cold", () => setOilDraft((d) => ({ ...d, cold: !d.cold })))}
                    <Button variant="accent" onClick={addOil} className="ml-auto !py-1.5">
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </Section>

            <Section
              title="Outreach"
              icon="solar:letter-linear"
              summary={outreach ? `${outreach.today.sent} sent today` : "Offline"}
            >
              {outreach ? (
                <>
                  <div className="flex items-end gap-6">
                    <div>
                      <p className="stat-num">{outreach.today.sent}</p>
                      <p className="text-[12px] text-muted">sent today</p>
                    </div>
                    <div>
                      <p className="stat-num text-lilac">{outreach.today.replies}</p>
                      <p className="text-[12px] text-muted">replies today</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[12.5px] text-muted">
                    This week: {outreach.week.sent} sent · {plural(outreach.week.replies, "reply", "replies")} ·{" "}
                    {plural(outreach.week.callsBooked, "call")} · {outreach.week.won} won
                  </p>
                  {outreach.warmLeads.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {outreach.warmLeads.slice(0, 6).map((l) => (
                        <span key={l.id} className="tag">
                          <span className="h-1.5 w-1.5 rounded-full bg-neon" />
                          {l.company || l.name}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[13px] text-muted">The outreach app isn&apos;t answering right now.</p>
              )}
              <a href="https://signal-outreach-two.vercel.app" target="_blank" rel="noopener noreferrer" className="btn mt-4 w-full">
                Open outreach
              </a>
            </Section>
          </Group>
        </div>
      )}
    </GsapEntrance>
  );
}

type NewItem = { text: string; product: string; link: string; owned: boolean; days: number[] };
const EMPTY: NewItem = { text: "", product: "", link: "", owned: true, days: [] };

function RoutineCard({
  size = "normal",
  current = false,
  title,
  hint,
  steps,
  items,
  ticks,
  onToggle,
  editing,
  onEdit,
  onSave,
  onRemove,
  onAdd,
}: {
  size?: "large" | "normal";
  current?: boolean;
  title: string;
  hint: string;
  steps: Step[];
  items: Item[];
  ticks: Record<string, boolean>;
  onToggle: (id: string) => void;
  editing: boolean;
  onEdit: () => void;
  onSave: (id: string, patch: Partial<Omit<Item, "days">> & { days?: number[] }) => void;
  onRemove: (id: string) => void;
  onAdd: (draft: NewItem) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<NewItem>(EMPTY);
  const large = size === "large";
  const doable = steps.filter((s) => s.owned);
  const done = doable.filter((s) => ticks[s.id]).length;

  return (
    <div className={`gsap-entrance card flex flex-col ${large ? "p-6 sm:p-8" : "card-pad"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-[12px] text-dim">
            {current && <span className="dot is-live" />}
            {current ? `Now · ${hint}` : hint}
          </p>
          <h2 className={`mt-1 font-semibold tracking-tight text-text ${large ? "text-[30px] leading-tight" : "text-[18px]"}`}>{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {!editing && (
            <span className={`font-mono tabular text-muted ${large ? "text-[15px]" : "text-[12px]"}`}>
              {done}/{doable.length}
            </span>
          )}
          <button onClick={onEdit} className={`btn-ghost !px-2 !py-1 !text-[12px] ${editing ? "!text-text" : ""}`}>
            {editing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {!editing && (
        <>
          <div className={`progress ${large ? "mt-5" : "mt-3"}`}>
            <span style={{ width: `${doable.length ? (done / doable.length) * 100 : 0}%` }} />
          </div>
          <ul className={`flex flex-col divide-y divide-line ${large ? "mt-4" : "mt-2"}`}>
            {steps.length === 0 && <li className="px-2 py-2 text-[13px] text-dim">Nothing here. Tap Edit to add a step.</li>}
            {steps.map((s) => (
              <li key={s.id}>
                <div
                  role={s.owned ? "button" : undefined}
                  tabIndex={s.owned ? 0 : undefined}
                  onClick={() => s.owned && onToggle(s.id)}
                  onKeyDown={(e) => s.owned && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle(s.id))}
                  className={`flex w-full items-start gap-3.5 text-left transition-colors ${large ? "px-1 py-3.5" : "px-1 py-2.5"} ${s.owned ? "cursor-pointer hover:bg-black/[0.02]" : ""}`}
                >
                  <span className={`check mt-0.5 ${ticks[s.id] && s.owned ? "is-on" : ""} ${s.owned ? "" : "opacity-30"}`}>
                    {ticks[s.id] && s.owned && (
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M2.5 6.5l2.2 2L9.5 3.5" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block ${large ? "text-[16px]" : "text-[14px]"} ${ticks[s.id] && s.owned ? "text-dim line-through" : s.owned ? "text-text" : "text-muted"}`}>
                      {s.text}
                    </span>
                    {s.product && <span className="mt-0.5 block truncate text-[12px] text-dim">{s.product}</span>}
                    {!s.owned && (
                      <span className="mt-1 flex items-center gap-2">
                        <span className="tag tag-amber">Need to buy</span>
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-[12px] text-lilac hover:underline">
                            Buy ↗
                          </a>
                        )}
                      </span>
                    )}
                    {s.auto && <span className="mt-1 inline-block text-[11px] text-dim">From your rota</span>}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {editing && (
        <div className="mt-3 flex flex-col">
          {items.map((i) => (
            <div key={i.id} className="border-b border-line px-1 py-2.5 last:border-b-0">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] text-text">{i.text}</p>
                  {i.product && <p className="truncate text-[12px] text-dim">{i.product}</p>}
                  <p className="text-[11.5px] text-muted">{daysLabel(i.days)}</p>
                </div>
                <button onClick={() => onRemove(i.id)} aria-label={`Remove ${i.text}`} className="btn-ghost !px-1.5 !py-0.5 hover:!text-red-500">
                  ×
                </button>
              </div>
              {(i.product || !i.owned) && (
                <button onClick={() => onSave(i.id, { owned: !i.owned })} className={`tag mt-2 ${i.owned ? "tag-purple" : "tag-amber"}`}>
                  {i.owned ? "Have it" : "Need to buy"}
                </button>
              )}
            </div>
          ))}

          <form
            className="mt-3 flex flex-col gap-2 border-t border-line pt-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!draft.text.trim()) return;
              if (await onAdd(draft)) setDraft(EMPTY);
            }}
          >
            <input value={draft.text} onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))} placeholder="New step, e.g. Beard oil" className="input" />
            <input value={draft.product} onChange={(e) => setDraft((d) => ({ ...d, product: e.target.value }))} placeholder="Product (optional)" className="input" />
            <input value={draft.link} onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))} placeholder="Buy link (optional)" className="input" />
            <div className="flex flex-wrap items-center gap-1">
              {WEEKDAYS.map((w, n) => {
                const on = draft.days.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={WEEKDAY_NAMES[n]}
                    onClick={() => setDraft((d) => ({ ...d, days: on ? d.days.filter((x) => x !== n) : [...d.days, n] }))}
                    className={`tag !w-7 justify-center ${on ? "tag-purple" : "opacity-60"}`}
                  >
                    {w}
                  </button>
                );
              })}
              <span className="ml-1 text-[11px] text-dim">{draft.days.length ? "" : "every day"}</span>
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setDraft((d) => ({ ...d, owned: !d.owned }))} className={`tag ${draft.owned ? "tag-purple" : "tag-amber"}`}>
                {draft.owned ? "Have it" : "Need to buy"}
              </button>
              <Button variant="accent" type="submit" disabled={!draft.text.trim()} className="!py-1.5">
                Add
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
