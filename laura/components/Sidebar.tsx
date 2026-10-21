"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusBar } from "@/components/StatusBar";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/notes", label: "Notes" },
  { href: "/reminders", label: "Reminders" },
  { href: "/vault", label: "Vault" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full shrink-0 flex-col border-b border-neutral-800 bg-neutral-950 sm:h-screen sm:w-52 sm:border-b-0 sm:border-r">
      <div className="flex items-center gap-2 border-b border-neutral-800 px-5 py-4">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.5)]" />
        <span className="font-semibold uppercase tracking-[0.2em] text-neutral-100">Laura</span>
      </div>

      <div className="hidden sm:block">
        <StatusBar />
      </div>

      <ul className="flex flex-1 flex-row gap-1 px-2 py-2 sm:flex-col sm:px-3">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`relative block rounded-sm px-3 py-2 text-sm tracking-wide transition-colors ${
                  active
                    ? "bg-amber-500/10 text-amber-300"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                }`}
              >
                {active && (
                  <span className="absolute inset-y-1 left-0 w-0.5 bg-amber-400" aria-hidden="true" />
                )}
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
