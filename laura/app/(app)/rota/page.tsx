"use client";

import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { SidebarCard, Stat } from "@/components/SidebarCard";
import { ShiftCard } from "@/components/ShiftCard";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";

type Shift = {
  id: string;
  startAt: string;
  endAt: string;
  location: string | null;
  colleagues: string | null;
  note: string | null;
  source: string;
  commutePlan: string | null;
};

type ParsedShift = {
  startAt: string;
  endAt: string;
  location: string | null;
  colleagues: string | null;
  note: string | null;
};

type Profile = { homeAddress: string | null; workAddress: string | null; arrivalBufferMinutes: number };

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function RotaPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [colleagues, setColleagues] = useState("");

  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedShift[] | null>(null);
  const [savingParsed, setSavingParsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile>({
    homeAddress: null,
    workAddress: null,
    arrivalBufferMinutes: 15,
  });
  const [profileDraft, setProfileDraft] = useState(profile);
  const [savingProfile, setSavingProfile] = useState(false);

  // Deferred to an effect rather than read directly during render: a bare
  // Date.now() in a Client Component is flagged by Next's prerender as a
  // non-deterministic value. Shifts load async too, so the brief null gap
  // before hydration never shows stale grouping.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  function load() {
    fetch("/api/rota")
      .then((res) => res.json())
      .then((data) => setShifts(data.shifts ?? []))
      .catch(() => setError("Couldn't load the rota."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setProfileDraft(data.profile);
        }
      })
      .catch(() => {});
  }, []);

  async function addShift() {
    if (!startAt || !endAt) return;
    setError(null);
    try {
      const res = await fetch("/api/rota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          location: location || undefined,
          colleagues: colleagues || undefined,
          source: "manual",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save the shift.");
      setStartAt("");
      setEndAt("");
      setLocation("");
      setColleagues("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the shift.");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/rota/${id}`, { method: "DELETE" });
    load();
  }

  async function parsePhoto(file: File) {
    setParsing(true);
    setError(null);
    setParsed(null);
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/rota/parse", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't read that photo.");
      if (!data.shifts?.length) throw new Error("Couldn't find any shifts in that photo.");
      setParsed(data.shifts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that photo.");
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function updateParsed(i: number, patch: Partial<ParsedShift>) {
    setParsed((prev) => prev?.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) ?? null);
  }

  async function saveParsed() {
    if (!parsed) return;
    setSavingParsed(true);
    setError(null);
    try {
      for (const shift of parsed) {
        const res = await fetch("/api/rota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...shift, source: "photo" }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Couldn't save one of the shifts.");
        }
      }
      setParsed(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the shifts.");
    } finally {
      setSavingParsed(false);
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileDraft),
      });
      const data = await res.json();
      if (res.ok) setProfile(data.profile);
    } finally {
      setSavingProfile(false);
    }
  }

  const todayEnd = now === null ? null : startOfDay(now) + 24 * 60 * 60 * 1000;
  const weekEnd = now === null ? null : startOfDay(now) + 7 * 24 * 60 * 60 * 1000;
  const upcoming = now === null ? [] : shifts.filter((s) => new Date(s.endAt).getTime() >= now);
  const today =
    todayEnd === null ? [] : upcoming.filter((s) => new Date(s.startAt).getTime() < todayEnd);
  const thisWeek =
    todayEnd === null || weekEnd === null
      ? []
      : upcoming.filter((s) => {
          const t = new Date(s.startAt).getTime();
          return t >= todayEnd && t < weekEnd;
        });
  const later =
    weekEnd === null ? [] : upcoming.filter((s) => new Date(s.startAt).getTime() >= weekEnd);
  const nextShift = upcoming[0];

  const SECTIONS: { label: string; items: Shift[] }[] = [
    { label: "Today", items: today },
    { label: "This week", items: thisWeek },
    { label: "Later", items: later },
  ];

  return (
    <GsapEntrance className="relative mx-auto max-w-5xl px-6 pb-20">
      <div className="gsap-entrance flex items-center gap-3">
        <h1 className="font-thin text-4xl tracking-tight text-neutral-100">Rota</h1>
        <Pill>{upcoming.length} upcoming</Pill>
      </div>
      <p className="gsap-entrance mt-2 text-sm text-neutral-500">
        your work schedule — upload a photo of it, or add shifts by hand
      </p>
      <div className="gsap-entrance mt-5 h-px w-full bg-gradient-to-r from-[var(--calendar-accent)]/70 via-[var(--calendar-accent)]/20 to-transparent" />

      <div className="gsap-entrance relative mt-8 rounded-3xl bg-gradient-to-b from-[#19191b] to-[#121213] shadow-[0_20px_50px_-25px_rgba(0,0,0,0.9)] p-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
          Upload a rota photo
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) parsePhoto(file);
            }}
            className="text-sm text-neutral-400 file:mr-3 file:rounded-full file:border file:border-neutral-800 file:bg-neutral-950/60 file:px-3.5 file:py-1.5 file:text-xs file:text-neutral-300 file:transition-colors hover:file:border-neutral-600"
          />
          {parsing && <span className="text-xs text-neutral-500">Reading photo…</span>}
        </div>

        {parsed && (
          <div className="mt-4 flex flex-col gap-3">
            {parsed.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-2 rounded-xl bg-neutral-900/70 p-3 sm:grid-cols-2"
              >
                <input
                  type="datetime-local"
                  value={toLocalInputValue(s.startAt)}
                  onChange={(e) => updateParsed(i, { startAt: new Date(e.target.value).toISOString() })}
                  className="rounded-xl bg-neutral-900/70 px-2.5 py-1.5 text-xs text-neutral-300 outline-none [color-scheme:dark]"
                />
                <input
                  type="datetime-local"
                  value={toLocalInputValue(s.endAt)}
                  onChange={(e) => updateParsed(i, { endAt: new Date(e.target.value).toISOString() })}
                  className="rounded-xl bg-neutral-900/70 px-2.5 py-1.5 text-xs text-neutral-300 outline-none [color-scheme:dark]"
                />
                <input
                  value={s.location ?? ""}
                  onChange={(e) => updateParsed(i, { location: e.target.value || null })}
                  placeholder="Location"
                  className="rounded-xl bg-neutral-900/70 px-2.5 py-1.5 text-xs text-neutral-300 outline-none placeholder:text-neutral-600"
                />
                <input
                  value={s.colleagues ?? ""}
                  onChange={(e) => updateParsed(i, { colleagues: e.target.value || null })}
                  placeholder="Colleagues"
                  className="rounded-xl bg-neutral-900/70 px-2.5 py-1.5 text-xs text-neutral-300 outline-none placeholder:text-neutral-600"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setParsed(null)}>
                Discard
              </Button>
              <Button variant="accent" onClick={saveParsed} disabled={savingParsed}>
                {savingParsed ? "Saving…" : `Save ${parsed.length} shift${parsed.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="gsap-entrance relative mt-4 rounded-3xl bg-gradient-to-b from-[#19191b] to-[#121213] shadow-[0_20px_50px_-25px_rgba(0,0,0,0.9)] p-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
          Add a shift by hand
        </span>
        <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="border-b border-[var(--calendar-accent)]/40 bg-transparent px-0 pb-2 pt-1 font-light focus:border-[var(--calendar-accent)] text-sm text-neutral-300 outline-none [color-scheme:dark]"
          />
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="border-b border-[var(--calendar-accent)]/40 bg-transparent px-0 pb-2 pt-1 font-light focus:border-[var(--calendar-accent)] text-sm text-neutral-300 outline-none [color-scheme:dark]"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="border-b border-[var(--calendar-accent)]/40 bg-transparent px-0 pb-2 pt-1 font-light focus:border-[var(--calendar-accent)] text-sm text-neutral-300 outline-none placeholder:text-neutral-600"
          />
          <input
            value={colleagues}
            onChange={(e) => setColleagues(e.target.value)}
            placeholder="Colleagues (optional)"
            className="border-b border-[var(--calendar-accent)]/40 bg-transparent px-0 pb-2 pt-1 font-light focus:border-[var(--calendar-accent)] text-sm text-neutral-300 outline-none placeholder:text-neutral-600"
          />
        </div>
        <div className="mt-3.5 flex justify-end">
          <Button variant="accent" onClick={addShift} disabled={!startAt || !endAt}>
            Add shift
          </Button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          {error && <p className="gsap-entrance mb-4 text-sm text-red-400">{error}</p>}

          {loaded && upcoming.length === 0 ? (
            <EmptyState
              icon={<iconify-icon icon="solar:calendar-linear" className="text-lg" />}
              title="No shifts on the rota"
              description="Upload a photo of your rota, or add one above."
            />
          ) : (
            SECTIONS.map(
              ({ label, items }) =>
                items.length > 0 && (
                  <div key={label} className="mb-8">
                    <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
                      {label} · {items.length}
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3">
                      {items.map((shift) => (
                        <div key={shift.id} className="gsap-entrance">
                          <ShiftCard {...shift} onDelete={() => remove(shift.id)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )
          )}
        </div>

        <aside className="gsap-entrance flex flex-col gap-4">
          <SidebarCard title="Commute settings">
            <div className="flex flex-col gap-2">
              <input
                value={profileDraft.homeAddress ?? ""}
                onChange={(e) => setProfileDraft((p) => ({ ...p, homeAddress: e.target.value }))}
                placeholder="Home address"
                className="border-b border-[var(--calendar-accent)]/40 bg-transparent px-0 pb-2 pt-1 font-light focus:border-[var(--calendar-accent)] text-xs text-neutral-300 outline-none placeholder:text-neutral-600"
              />
              <input
                value={profileDraft.workAddress ?? ""}
                onChange={(e) => setProfileDraft((p) => ({ ...p, workAddress: e.target.value }))}
                placeholder="Work address"
                className="border-b border-[var(--calendar-accent)]/40 bg-transparent px-0 pb-2 pt-1 font-light focus:border-[var(--calendar-accent)] text-xs text-neutral-300 outline-none placeholder:text-neutral-600"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={profileDraft.arrivalBufferMinutes}
                  onChange={(e) =>
                    setProfileDraft((p) => ({ ...p, arrivalBufferMinutes: Number(e.target.value) }))
                  }
                  className="w-16 border-b border-[var(--calendar-accent)]/40 bg-transparent px-0 pb-2 pt-1 font-light focus:border-[var(--calendar-accent)] text-xs text-neutral-300 outline-none"
                />
                <span className="text-xs text-neutral-500">min arrival buffer</span>
              </div>
              <Button variant="accent" onClick={saveProfile} disabled={savingProfile} className="mt-1 self-end">
                {savingProfile ? "Saving…" : "Save"}
              </Button>
            </div>
          </SidebarCard>

          <SidebarCard title="Stats">
            <div className="flex flex-col gap-2">
              <Stat label="Upcoming shifts" value={upcoming.length} />
              <Stat label="This week" value={thisWeek.length + today.length} />
              <Stat
                label="Next shift"
                value={nextShift ? new Date(nextShift.startAt).toLocaleDateString([], { weekday: "short" }) : "—"}
              />
            </div>
          </SidebarCard>
        </aside>
      </div>
    </GsapEntrance>
  );
}
