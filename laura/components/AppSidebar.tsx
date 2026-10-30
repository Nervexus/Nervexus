"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark, NavIcon } from "@/components/NavIcon";

const LINKS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/laura", label: "Laura", icon: "laura" },
  { href: "/routine", label: "Routine", icon: "routine" },
  { href: "/notes", label: "Notes", icon: "notes" },
  { href: "/reminders", label: "Reminders", icon: "reminders" },
  { href: "/rota", label: "Rota", icon: "rota" },
  { href: "/bookings", label: "Bookings", icon: "bookings" },
  { href: "/content", label: "Content", icon: "content" },
  { href: "/vault", label: "Vault", icon: "vault" },
  { href: "/calls", label: "Calls & texts", icon: "calls" },
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/hub", label: "System", icon: "hub" },
];

// The four that sit in the phone's bottom bar; the rest live under "More".
const PHONE_BAR = ["/laura", "/routine", "/reminders", "/rota"];

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

async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" });
  try {
    sessionStorage.removeItem("laura_session_open");
  } catch {
    // ignore
  }
  window.location.replace("/login");
}

/** A genuine refresh for when the app feels laggy or stale: drop any
 * service worker and cached responses, then reload from the server. */
async function refreshApp() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // best effort -- reload regardless
  }
  window.location.reload();
}

/** The app's nav: a 76px icon rail on desktop (tooltips on hover, purple
 * active tile with a bar on the rail's edge, small count badges), and a
 * bottom bar plus a "More" sheet on phones. */
export function AppSidebar() {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
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

  const countFor = (href: string): number | null => {
    const key = href.slice(1) as keyof Counts;
    return key in counts ? counts[key] : null;
  };
  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Desktop rail */}
      <nav className="sticky top-0 z-40 hidden h-screen w-[76px] shrink-0 flex-col items-center border-r border-line bg-bg-1 py-5 sm:flex">
        <Link href="/" aria-label="LAURA home" className="relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-line-2 bg-[#0b0b0b]">
          <span className="logo-ring absolute inset-0 rounded-[14px]" aria-hidden />
          <LogoMark className="h-5 w-5" />
        </Link>

        <ul className="mt-7 flex flex-1 flex-col items-center gap-2.5">
          {LINKS.map((link, i) => {
            const active = isActive(link.href);
            const count = countFor(link.href);
            return (
              <li key={link.href} className={`group relative ${i === 3 || i === 10 ? "mt-3" : ""}`}>
                {active && <span className="absolute -left-4 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" aria-hidden />}
                <Link
                  href={link.href}
                  aria-label={link.label}
                  aria-current={active ? "page" : undefined}
                  className={`rail-btn ${active ? "is-active" : ""}`}
                >
                  <NavIcon name={link.icon} />
                </Link>
                {count !== null && count > 0 && <span className="rail-badge">{count > 99 ? "99+" : count}</span>}
                <span className="rail-tip">{link.label}</span>
              </li>
            );
          })}
        </ul>

        <div className="group relative mb-2">
          <button onClick={refreshApp} aria-label="Refresh" className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-line bg-surface text-muted transition-colors hover:text-text">
            <NavIcon name="refresh" />
          </button>
          <span className="rail-tip">Refresh the app</span>
        </div>
        <div className="group relative">
          <button onClick={signOut} aria-label="Sign out" className="flex h-10 w-10 items-center justify-center rounded-full border border-line-2 bg-surface text-[11px] font-semibold text-muted transition-colors hover:text-text">
            MH
          </button>
          <span className="rail-tip">Madoxs Harvey · Sign out</span>
        </div>
      </nav>

      {/* Phone bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-1/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
        <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {LINKS.filter((l) => PHONE_BAR.includes(l.href)).map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link href={link.href} className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[10.5px] font-medium ${active ? "text-text" : "text-dim"}`}>
                  <span className={`flex h-8 w-11 items-center justify-center rounded-[11px] ${active ? "bg-gradient-to-b from-[#9077d8] to-[#5b42a3] text-white" : ""}`}>
                    <NavIcon name={link.icon} />
                  </span>
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setMore(true)} className="flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[10.5px] font-medium text-dim">
              <span className="flex h-8 w-11 items-center justify-center rounded-[11px]">
                <NavIcon name="more" />
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      {more && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="modal-backdrop absolute inset-0" onClick={() => setMore(false)} aria-hidden />
          <div className="modal absolute inset-x-3 bottom-3 rounded-[22px] pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line-2 bg-[#0b0b0b]">
                  <LogoMark />
                </span>
                <span className="text-[15px] font-semibold">LAURA</span>
              </div>
              <button onClick={() => setMore(false)} aria-label="Close" className="btn-ghost">
                <NavIcon name="close" />
              </button>
            </div>
            <ul className="mt-5 grid grid-cols-3 gap-2">
              {LINKS.filter((l) => !PHONE_BAR.includes(l.href)).map((link) => {
                const active = isActive(link.href);
                const count = countFor(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMore(false)}
                      className={`item relative flex flex-col items-center gap-2 px-2 py-3.5 text-[12px] ${active ? "text-text" : "text-muted"}`}
                    >
                      <span className={`icon-tile ${active ? "!bg-gradient-to-b !from-[#9077d8] !to-[#5b42a3] !text-white" : ""}`}>
                        <NavIcon name={link.icon} />
                      </span>
                      {link.label}
                      {count !== null && count > 0 && <span className="rail-badge !right-2 !top-2">{count}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex gap-2">
              <button onClick={refreshApp} className="btn flex-1">
                <NavIcon name="refresh" className="h-4 w-4" /> Refresh
              </button>
              <button onClick={signOut} className="btn flex-1">
                <NavIcon name="logout" className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
