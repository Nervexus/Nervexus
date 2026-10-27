"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

const LINKS = [
  { href: "/", label: "Home", icon: "solar:home-2-linear" },
  { href: "/laura", label: "Laura", icon: "solar:soundwave-linear" },
  { href: "/routine", label: "Routine", icon: "solar:checklist-minimalistic-linear" },
  { href: "/notes", label: "Notes", icon: "solar:notebook-linear" },
  { href: "/reminders", label: "Reminders", icon: "solar:alarm-linear" },
  { href: "/rota", label: "Rota", icon: "solar:calendar-linear" },
  { href: "/bookings", label: "Bookings", icon: "solar:bookmark-linear" },
  { href: "/content", label: "Content", icon: "solar:gallery-linear" },
  { href: "/vault", label: "Vault", icon: "solar:lock-keyhole-linear" },
  { href: "/calls", label: "Calls", icon: "solar:phone-calling-linear" },
  { href: "/settings", label: "Settings", icon: "solar:settings-linear" },
];

type Counts = {
  notes: number | null;
  reminders: number | null;
  vault: number | null;
  calls: number | null;
  rota: number | null;
  bookings: number | null;
  content: number | null;
  settings: number | null;
};

/** The app shell's nav: a sticky left column on desktop, a top bar on
 * mobile (same pattern the very first version of this app used, just
 * restyled for the monochrome glass system). Runs its own GSAP reveal on
 * mount rather than relying on each page's GsapEntrance, since this
 * component persists across client-side navigation within (app) instead
 * of remounting per page. */
export function AppSidebar() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLElement>(null);
  // Phones: the sidebar is a drawer from the left, opened by the menu button.
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({
    notes: null,
    reminders: null,
    vault: null,
    calls: null,
    rota: null,
    bookings: null,
    content: null,
    settings: null,
  });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const tween = gsap.fromTo(
      el.querySelectorAll(".gsap-entrance"),
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: "power4.out" }
    );
    const pulse = gsap.to(el.querySelectorAll(".pulse-dot"), {
      opacity: 0.25,
      duration: 1.1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    return () => {
      tween.kill();
      pulse.kill();
    };
  }, []);

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => setCounts((c) => ({ ...c, notes: data.notes?.length ?? 0 })))
      .catch(() => setCounts((c) => ({ ...c, notes: 0 })));
    fetch("/api/reminders")
      .then((res) => res.json())
      .then((data) =>
        setCounts((c) => ({
          ...c,
          reminders: (data.reminders ?? []).filter((r: { done: boolean }) => !r.done).length,
        }))
      )
      .catch(() => setCounts((c) => ({ ...c, reminders: 0 })));
    fetch("/api/vault")
      .then((res) => res.json())
      .then((data) => setCounts((c) => ({ ...c, vault: data.items?.length ?? 0 })))
      .catch(() => setCounts((c) => ({ ...c, vault: 0 })));
    fetch("/api/calls")
      .then((res) => res.json())
      .then((data) => setCounts((c) => ({ ...c, calls: data.logs?.length ?? 0 })))
      .catch(() => setCounts((c) => ({ ...c, calls: 0 })));
    fetch("/api/rota")
      .then((res) => res.json())
      .then((data) =>
        setCounts((c) => ({
          ...c,
          rota: (data.shifts ?? []).filter((s: { endAt: string }) => new Date(s.endAt) >= new Date())
            .length,
        }))
      )
      .catch(() => setCounts((c) => ({ ...c, rota: 0 })));
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) =>
        setCounts((c) => ({
          ...c,
          bookings: (data.bookings ?? []).filter((b: { status: string }) => b.status !== "cancelled")
            .length,
        }))
      )
      .catch(() => setCounts((c) => ({ ...c, bookings: 0 })));
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) =>
        setCounts((c) => ({
          ...c,
          content: (data.ideas ?? []).filter((i: { status: string }) => i.status !== "discarded")
            .length,
        }))
      )
      .catch(() => setCounts((c) => ({ ...c, content: 0 })));
    fetch("/api/settings/status")
      .then((res) => res.json())
      .then((data) =>
        setCounts((c) => ({
          ...c,
          settings: (data.items ?? []).filter((i: { status: string }) => i.status !== "connected")
            .length,
        }))
      )
      .catch(() => setCounts((c) => ({ ...c, settings: 0 })));
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#141416]/90 text-neutral-300 backdrop-blur-md sm:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="h-5 w-5" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
    <nav
      ref={rootRef}
      className={`fixed inset-y-3 left-3 z-50 flex w-64 flex-col rounded-3xl border border-white/[0.06] bg-gradient-to-b from-[#19191b] to-[#121213] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.04)] transition-transform duration-300 sm:sticky sm:inset-auto sm:top-4 sm:m-4 sm:h-[calc(100vh-2rem)] sm:w-60 sm:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-[110%]"
      }`}
    >
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className="gsap-entrance mx-3 flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-5"
      >
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]" />
        <span className="text-sm font-medium tracking-[0.3em] text-neutral-100">LAURA</span>
      </Link>

      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 sm:overflow-visible">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          const count =
            link.href === "/notes"
              ? counts.notes
              : link.href === "/reminders"
                ? counts.reminders
                : link.href === "/vault"
                  ? counts.vault
                  : link.href === "/calls"
                    ? counts.calls
                    : link.href === "/rota"
                      ? counts.rota
                      : link.href === "/bookings"
                        ? counts.bookings
                        : link.href === "/content"
                          ? counts.content
                          : link.href === "/settings"
                            ? counts.settings
                            : null;
          return (
            <li
              key={link.href}
              className={`gsap-entrance relative ${
                link.href === "/notes" || link.href === "/settings" ? "mt-3 border-t border-white/[0.06] pt-3" : ""
              }`}
            >
              {active && (
                <span
                  className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.9)]"
                  aria-hidden="true"
                />
              )}
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-all ${
                  active
                    ? "border border-white/10 bg-gradient-to-r from-violet-500/25 via-violet-500/[0.06] to-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_-8px_rgba(139,92,246,0.6)]"
                    : "border border-transparent text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-100"
                }`}
              >
                <iconify-icon
                  icon={link.icon}
                  className={`shrink-0 text-lg ${active ? "text-violet-200" : ""}`}
                />
                <span>{link.label}</span>
                {count !== null && count > 0 && (
                  <span className="ml-auto rounded-full border border-white/10 px-2 py-px font-mono text-[10px] text-neutral-400">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="gsap-entrance mx-3 mb-3 flex items-center gap-3 border-t border-white/[0.06] px-2 pt-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-xs text-neutral-300">
          MH
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-neutral-200">Madoxs Harvey</p>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.replace("/login");
            }}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-600 transition-colors hover:text-violet-300"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
    </>
  );
}
