"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { BookingsWidget } from "@/components/BookingsWidget";
import { BookingRow } from "@/components/BookingRow";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { GsapEntrance } from "@/components/GsapEntrance";

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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

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

  const SECTIONS: { label: string; items: Booking[] }[] = [
    { label: "Confirmed", items: confirmed },
    { label: "Pending", items: pending },
    { label: "Ideas", items: ideas },
    ...(showCancelled ? [{ label: "Cancelled", items: cancelled }] : []),
  ];

  return (
    <GsapEntrance className="relative mx-auto max-w-5xl px-6 pb-20">
      <div className="gsap-entrance flex items-center gap-3">
        <h1 className="font-thin text-3xl tracking-tight text-neutral-100">Bookings</h1>
        <Pill>{active.length} tracked</Pill>
      </div>
      <p className="gsap-entrance mt-2 text-sm text-neutral-500">
        restaurants, activities, and trips Laura&apos;s helped you look into — she researches and
        tracks, you always complete the booking yourself
      </p>

      <div className="gradient-border gsap-entrance relative mt-8 rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-6 backdrop-blur-md">
        <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">
          Search for options
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Italian restaurant near Soho for 4, Friday 8pm"
            className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 outline-none placeholder:text-neutral-600"
          />
          <Button onClick={search} disabled={searching || !query.trim()}>
            {searching ? "Searching…" : "Search"}
          </Button>
        </div>
        {searchResult && (
          <div className="mt-4 rounded-lg border border-neutral-800/60 bg-neutral-950/60 px-3 py-2.5">
            <p className="whitespace-pre-wrap text-sm text-neutral-300">{searchResult}</p>
            <div className="mt-2 flex justify-end">
              <Button variant="ghost" onClick={saveSearchAsIdea}>
                Save as an idea
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="gradient-border gsap-entrance relative mt-4 rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-6 backdrop-blur-md">
        <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">
          Add one by hand
        </span>
        <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title, e.g. Dinner at Lina's"
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 outline-none placeholder:text-neutral-600"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 outline-none [color-scheme:dark]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 outline-none [color-scheme:dark]"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="rounded-lg border border-neutral-800/60 bg-neutral-950/60 px-3 py-2 text-sm text-neutral-300 outline-none placeholder:text-neutral-600"
          />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Booking link (optional)"
            className="rounded-lg border border-neutral-800/60 bg-neutral-950/60 px-3 py-2 text-sm text-neutral-300 outline-none placeholder:text-neutral-600 sm:col-span-2"
          />
        </div>
        <div className="mt-3.5 flex justify-end">
          <Button onClick={addBooking} disabled={!title.trim()}>
            Add booking
          </Button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px]">
        <div className="flex min-w-0 flex-col gap-5">
          {error && <p className="gsap-entrance text-sm text-red-400">{error}</p>}

          {loaded && active.length === 0 ? (
            <EmptyState
              icon={<iconify-icon icon="solar:bookmark-linear" className="text-lg" />}
              title="Nothing being tracked"
              description="Search for somewhere to go, or add one above."
            />
          ) : (
            SECTIONS.map(
              ({ label, items }) =>
                items.length > 0 && (
                  <div key={label} className="gsap-entrance">
                    <BookingsWidget count={items.length} label={label}>
                      {items.map((booking) => (
                        <BookingRow
                          key={booking.id}
                          {...booking}
                          onStatusChange={(status) => updateStatus(booking.id, status)}
                          onDelete={() => remove(booking.id)}
                        />
                      ))}
                    </BookingsWidget>
                  </div>
                )
            )
          )}

          {cancelled.length > 0 && (
            <button
              onClick={() => setShowCancelled((s) => !s)}
              className="self-start font-mono text-[11px] uppercase tracking-widest text-neutral-600 hover:text-neutral-300"
            >
              {showCancelled ? "Hide" : "Show"} cancelled ({cancelled.length})
            </button>
          )}
        </div>

        <aside className="gsap-entrance">
          <BookingsWidget count={active.length} label="tracked">
            {[
              { label: "Confirmed", value: confirmed.length },
              { label: "Pending", value: pending.length },
              { label: "Ideas", value: ideas.length },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-xl bg-neutral-900/60 px-3 py-2.5">
                <span className="text-sm text-neutral-300">{s.label}</span>
                <span className="font-mono text-xs tabular-nums text-neutral-500">{s.value}</span>
              </div>
            ))}
          </BookingsWidget>
        </aside>
      </div>
    </GsapEntrance>
  );
}
