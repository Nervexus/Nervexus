"use client";

import { useEffect, useState } from "react";
import { BookingRow } from "@/components/BookingRow";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";
import { Empty, Group, PageHeader, Row, Section } from "@/components/ui/layout";

type Booking = {
  id: string;
  title: string;
  category: string;
  status: string;
  dateTime: string | null;
  partySize: number | null;
  location: string | null;
  link: string | null;
  note: string | null;
};

const CATEGORIES = ["restaurant", "activity", "travel", "other"] as const;
const CATEGORY_ICON: Record<string, string> = {
  restaurant: "solar:chef-hat-linear",
  activity: "solar:ticket-linear",
  travel: "solar:map-point-linear",
  other: "solar:bookmark-linear",
};

const VIEWS = ["all", "confirmed", "pending", "idea", "cancelled"] as const;
const VIEW_LABEL: Record<(typeof VIEWS)[number], string> = {
  all: "All",
  confirmed: "Confirmed",
  pending: "Pending",
  idea: "Ideas",
  cancelled: "Cancelled",
};
const STATUS_ORDER: Record<string, number> = { confirmed: 0, pending: 1, idea: 2, cancelled: 3 };

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<(typeof VIEWS)[number]>("all");

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("other");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");

  function load() {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings ?? []))
      .catch(() => setError("Couldn't load bookings."))
      .finally(() => setLoaded(true));
  }

  useEffect(load, []);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    setSearchResult(null);
    try {
      const res = await fetch("/api/bookings/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't search for booking options.");
      setSearchResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't search for booking options.");
    } finally {
      setSearching(false);
    }
  }

  async function saveSearchAsIdea() {
    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: query.trim(), status: "idea", note: searchResult }),
    });
    setQuery("");
    setSearchResult(null);
    load();
  }

  async function addBooking() {
    if (!title.trim()) return;
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          dateTime: dateTime ? new Date(dateTime).toISOString() : undefined,
          location: location || undefined,
          link: link || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save the booking.");
      setTitle("");
      setDateTime("");
      setLocation("");
      setLink("");
      setCategory("other");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the booking.");
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    load();
  }

  const active = bookings.filter((b) => b.status !== "cancelled");
  const cancelled = bookings.filter((b) => b.status === "cancelled");
  const confirmed = active.filter((b) => b.status === "confirmed");
  const pending = active.filter((b) => b.status === "pending");
  const ideas = active.filter((b) => b.status === "idea");

  const shown = (view === "all" ? active : bookings.filter((b) => b.status === view))
    .slice()
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
  const views = VIEWS.filter((v) => v !== "cancelled" || cancelled.length > 0);

  return (
    <GsapEntrance className="relative mx-auto max-w-3xl px-4 sm:px-[26px] pb-20">
      <div className="gsap-entrance">
        <PageHeader title="Bookings" meta={<Pill>{active.length} tracked</Pill>} sub="Laura researches and tracks. You always book it yourself." />
      </div>

      <div className="gsap-entrance card flex items-center gap-2 p-2 pl-4">
        <iconify-icon icon="solar:magnifer-linear" className="shrink-0 text-lg text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Italian near Soho for 4, Friday 8pm"
          className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-text placeholder:text-dim"
        />
        <button onClick={search} disabled={searching || !query.trim()} className="btn btn-primary shrink-0 !px-4 !py-2">
          {searching ? "…" : "Search"}
        </button>
      </div>
      {searchResult && (
        <div className="gsap-entrance panel mt-3 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm text-neutral-600">{searchResult}</p>
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" onClick={saveSearchAsIdea}>
              Save as an idea
            </Button>
          </div>
        </div>
      )}

      {error && <p className="gsap-entrance mt-4 text-sm text-red-400">{error}</p>}

      <div className="gsap-entrance mt-6 overflow-x-auto">
        <div className="tabs">
          {views.map((v) => (
            <button key={v} onClick={() => setView(v)} className={`tab whitespace-nowrap ${view === v ? "is-active" : ""}`}>
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="gsap-entrance mt-3">
        <Group>
          {!loaded ? (
            <Empty>Loading…</Empty>
          ) : shown.length === 0 ? (
            <Empty>{view === "all" ? "Nothing being tracked. Search above, or add one by hand." : `No ${VIEW_LABEL[view].toLowerCase()} bookings.`}</Empty>
          ) : (
            shown.map((booking) => (
              <BookingRow
                key={booking.id}
                {...booking}
                onStatusChange={(status) => updateStatus(booking.id, status)}
                onDelete={() => remove(booking.id)}
              />
            ))
          )}
        </Group>
      </div>

      <div className="gsap-entrance mt-6">
        <Group>
          <Section title="Add by hand" icon="solar:add-circle-linear">
            <div className="flex flex-col gap-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Dinner at Lina's" className="input text-sm" />
              <div className="tabs w-full">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`tab flex flex-1 items-center justify-center gap-1.5 !px-2 capitalize ${category === c ? "is-active" : ""}`}
                  >
                    <iconify-icon icon={CATEGORY_ICON[c]} className="text-base" />
                    <span className="hidden text-[12px] sm:inline">{c}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className="input text-sm" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="input text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Booking link" className="input min-w-0 flex-1 text-sm" />
                <button onClick={addBooking} disabled={!title.trim()} className="btn btn-primary shrink-0">
                  Add
                </button>
              </div>
            </div>
          </Section>
          <Section title="Overview" icon="solar:chart-2-linear" summary={`${confirmed.length} confirmed · ${pending.length} pending`}>
            {[
              { label: "Confirmed", value: confirmed.length },
              { label: "Pending", value: pending.length },
              { label: "Ideas", value: ideas.length },
              { label: "Cancelled", value: cancelled.length },
            ].map((s) => (
              <Row key={s.label} title={s.label} trailing={<span className="font-mono text-[13px] tabular-nums text-muted">{s.value}</span>} />
            ))}
          </Section>
        </Group>
      </div>
    </GsapEntrance>
  );
}
