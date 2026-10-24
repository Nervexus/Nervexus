"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { Pill } from "@/components/Pill";

const LINKS = [
  { href: "/laura", label: "Laura", icon: "solar:soundwave-linear" },
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
    <nav
      ref={rootRef}
      className="flex w-full shrink-0 flex-col border-b border-neutral-800/60 bg-neutral-950/70 backdrop-blur-xl sm:sticky sm:top-0 sm:h-screen sm:w-64 sm:border-b-0 sm:border-r"
    >
      <Link
        href="/"
        className="gsap-entrance flex items-center gap-2.5 border-b border-neutral-800/60 px-6 py-5"
      >
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-neutral-200" />
        <span className="font-thin text-lg tracking-tighter text-neutral-100">LAURA</span>
      </Link>

      <ul className="flex flex-1 flex-row gap-1 overflow-x-auto px-3 py-3 sm:flex-col sm:overflow-visible sm:py-4">
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
            <li key={link.href} className="gsap-entrance shrink-0 sm:shrink">
              <Link
                href={link.href}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-mono text-xs tracking-tight transition-colors ${
                  active
                    ? "bg-neutral-900/70 text-neutral-100"
                    : "text-neutral-500 hover:bg-neutral-900/40 hover:text-neutral-200"
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-y-1.5 left-0 hidden w-0.5 rounded-full bg-neutral-100 sm:block"
                    aria-hidden="true"
                  />
                )}
                <iconify-icon icon={link.icon} className="shrink-0 text-base" />
                <span>{link.label}</span>
                {count !== null && count > 0 && (
                  <span className="ml-auto hidden font-mono text-[10px] text-neutral-600 sm:inline">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="gsap-entrance gradient-border m-3 hidden rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-4 backdrop-blur-sm sm:block">
        <Pill>
          <span className="normal-case tracking-normal">online</span>
        </Pill>
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-600">
          Laura&apos;s personal assistant HQ — notes, reminders, and a vault that only this page
          can decrypt.
        </p>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.replace("/login");
          }}
          className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-600 transition-colors hover:text-neutral-200"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
