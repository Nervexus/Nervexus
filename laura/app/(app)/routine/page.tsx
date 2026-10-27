"use client";

import { useEffect, useState } from "react";
import { GsapEntrance } from "@/components/GsapEntrance";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";

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
  { slot: "morning", title: "Morning", hint: "Products and getting ready" },
  { slot: "afternoon", title: "Afternoon", hint: "Work block and the middle of the day" },
  { slot: "night", title: "Night", hint: "Wind down and set up tomorrow" },
];
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

  return (
    <GsapEntrance className="relative mx-auto max-w-6xl px-4 sm:px-[26px]">
      <div className="gsap-entrance flex flex-wrap items-center gap-3">
        <h1 className="page-title">Routine</h1>
        <Pill>{day?.label ?? "…"}</Pill>
        {day && <span className="pill">{day.shift ? `Shift ${day.shift.start}–${day.shift.end}` : "Day off"}</span>}
        <div className="tabs ml-auto">
          {(["today", "tomorrow"] as const).map((w) => (
            <button key={w} onClick={() => switchDay(w)} className={`tab capitalize ${which === w ? "is-active" : ""}`}>
              {w}
            </button>
          ))}
        </div>
      </div>
      <p className="gsap-entrance page-sub mt-1">Tick things off as you go. Tap Edit on a card to add or remove steps.</p>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {day && (
        <>
          {/* Morning / Afternoon / Night + Key dates */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {SLOTS.map(({ slot, title, hint }) => (
              <RoutineCard
                key={slot}
                title={title}
                hint={hint}
                steps={day[slot]}
                items={items.filter((i) => i.slot === slot)}
                ticks={ticks}
                onToggle={toggle}
                editing={editing === slot}
                onEdit={() => setEditing(editing === slot ? null : slot)}
                onSave={saveItem}
                onRemove={removeItem}
                onAdd={(draft) => addItem(slot, draft)}
              />
            ))}

            <div className="gsap-entrance card card-pad">
              <h2 className="label">Key dates</h2>
              <ul className="mt-3.5 flex flex-col gap-2">
                {keyDates.map((k) => (
                  <li key={k.date} className="item px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-lilac">{k.label}</span>
                      <span className="font-mono text-[11px] tabular text-dim">{k.daysAway === 0 ? "today" : `${k.daysAway}d`}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-text">{k.items.join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {day.shopping.length > 0 && (
            <div className="gsap-entrance card card-pad mt-4 flex flex-wrap items-center gap-2">
              <span className="label mr-1">Still to buy</span>
              {day.shopping.map((s) =>
                s.link ? (
                  <a key={s.product} href={s.link} target="_blank" rel="noopener noreferrer" className="tag tag-amber hover:opacity-80">
                    {s.product} ↗
                  </a>
                ) : (
                  <span key={s.product} className="tag tag-amber">
                    {s.product}
                  </span>
                )
              )}
            </div>
          )}

          {/* Work rota */}
          <div className="gsap-entrance card card-pad mt-4">
            <div className="flex items-center justify-between">
              <h2 className="label">Work rota · next 7 days</h2>
              <a href="/rota" className="btn-ghost !py-1 !text-[12px]">
                Edit rota
              </a>
            </div>
            <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
              {week.map((d, i) => (
                <div key={d.date} className={`item flex flex-col gap-1.5 px-3 py-3 ${i === 0 ? "!border-[rgba(139,111,212,0.4)]" : ""}`}>
                  <span className={`text-[12px] font-semibold ${i === 0 ? "text-lilac" : "text-muted"}`}>{i === 0 ? "Today" : d.label}</span>
                  {d.shift ? (
                    <span className="text-[15px] font-medium text-text">
                      {d.shift.start}–{d.shift.end}
                    </span>
                  ) : (
                    <span className="text-[15px] text-dim">Off</span>
                  )}
                  {d.shift?.colleagues && <span className="text-[11.5px] text-muted">with {d.shift.colleagues}</span>}
                  {d.block && <span className="tag tag-purple self-start">{d.block.title}</span>}
                  {d.items.map((k) => (
                    <span key={k} className="text-[11.5px] text-lilac">
                      {k}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Hair, scent, outreach */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="gsap-entrance card card-pad">
              <h2 className="label">Hair &amp; beard</h2>
              <p className="mt-3 text-[14px] text-text">{day.hair.headline}</p>
              <p className="mt-1 text-[12.5px] text-muted">{day.hair.detail}</p>
            </div>

            <div className="gsap-entrance card card-pad">
              <h2 className="label">Perfume oils · {oils.length}</h2>
              <p className="mt-3 text-[14px] text-text">Wear: {day.wear.oil?.name ?? "add an oil below"}</p>
              <p className="mt-1 text-[12.5px] text-muted">
                {day.wear.oil ? day.wear.why : "1–2 dabs on moisturised wrists and neck, after you're dressed."}
              </p>
              {plans.length > 0 && day.wear.oil && (
                <ul className="mt-3 flex flex-col gap-1">
                  {plans.slice(0, 4).map((p, i) => (
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
                  placeholder="Oil name"
                  className="input"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  {flag(oilDraft.day, "day", () => setOilDraft((d) => ({ ...d, day: !d.day })))}
                  {flag(oilDraft.night, "night", () => setOilDraft((d) => ({ ...d, night: !d.night })))}
                  {flag(oilDraft.cold, "cold", () => setOilDraft((d) => ({ ...d, cold: !d.cold })))}
                  <Button variant="accent" onClick={addOil} disabled={!oilDraft.name.trim()} className="ml-auto !py-1.5">
                    Add oil
                  </Button>
                </div>
              </div>
            </div>

            <div className="gsap-entrance card card-pad">
              <h2 className="label">Outreach</h2>
              {outreach ? (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2">
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
                    This week: {outreach.week.sent} sent · {plural(outreach.week.replies, "reply", "replies")} ·{" "}
                    {plural(outreach.week.callsBooked, "call")} · {outreach.week.won} won
                  </p>
                  {outreach.warmLeads.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {outreach.warmLeads.slice(0, 6).map((l) => (
                        <span key={l.id} className="tag tag-purple">
                          {l.company || l.name}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-3 text-[12.5px] text-muted">The outreach app isn&apos;t answering right now.</p>
              )}
              <a href="https://signal-outreach-two.vercel.app" target="_blank" rel="noopener noreferrer" className="btn mt-4 w-full">
                Open outreach
              </a>
            </div>
          </div>
        </>
      )}
    </GsapEntrance>
  );
}

type NewItem = { text: string; product: string; link: string; owned: boolean; days: number[] };
const EMPTY: NewItem = { text: "", product: "", link: "", owned: true, days: [] };

function RoutineCard({
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
  const doable = steps.filter((s) => s.owned);
  const done = doable.filter((s) => ticks[s.id]).length;

  return (
    <div className="gsap-entrance card card-pad flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-text">{title}</h2>
          <p className="text-[12px] text-dim">{hint}</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <span className="font-mono text-[12px] tabular text-muted">
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
          <div className="progress mt-3">
            <span style={{ width: `${doable.length ? (done / doable.length) * 100 : 0}%` }} />
          </div>
          <ul className="mt-3 flex flex-col gap-0.5">
            {steps.length === 0 && <li className="px-2 py-2 text-[13px] text-dim">Nothing here. Tap Edit to add a step.</li>}
            {steps.map((s) => (
              <li key={s.id}>
                <div
                  role={s.owned ? "button" : undefined}
                  tabIndex={s.owned ? 0 : undefined}
                  onClick={() => s.owned && onToggle(s.id)}
                  onKeyDown={(e) => s.owned && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle(s.id))}
                  className={`flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors ${s.owned ? "cursor-pointer hover:bg-white/[0.03]" : ""}`}
                >
                  <span className={`check mt-0.5 ${ticks[s.id] && s.owned ? "is-on" : ""} ${s.owned ? "" : "opacity-30"}`}>
                    {ticks[s.id] && s.owned && (
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M2.5 6.5l2.2 2L9.5 3.5" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[14px] ${ticks[s.id] && s.owned ? "text-dim line-through" : s.owned ? "text-text" : "text-muted"}`}>
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
        <div className="mt-3 flex flex-col gap-2">
          {items.map((i) => (
            <div key={i.id} className="item px-3 py-2.5">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] text-text">{i.text}</p>
                  {i.product && <p className="truncate text-[12px] text-dim">{i.product}</p>}
                  <p className="text-[11.5px] text-muted">{daysLabel(i.days)}</p>
                </div>
                <button onClick={() => onRemove(i.id)} aria-label={`Remove ${i.text}`} className="btn-ghost !px-1.5 !py-0.5 hover:!text-[#ff9a90]">
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
            className="mt-1 flex flex-col gap-2 border-t border-line pt-3"
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
