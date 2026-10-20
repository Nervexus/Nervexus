"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/notes", label: "Notes" },
  { href: "/reminders", label: "Reminders" },
  { href: "/vault", label: "Vault" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full shrink-0 flex-row border-b border-neutral-800 bg-neutral-950 sm:h-screen sm:w-48 sm:flex-col sm:border-r sm:border-b-0">
      <div className="px-5 py-4">
        <span className="font-semibold tracking-tight text-neutral-100">Laura</span>
      </div>
      <ul className="flex flex-1 flex-row gap-1 px-2 pb-2 sm:flex-col sm:px-3">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
