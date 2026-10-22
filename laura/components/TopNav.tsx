"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/laura", label: "Laura" },
  { href: "/notes", label: "Notes" },
  { href: "/reminders", label: "Reminders" },
  { href: "/vault", label: "Vault" },
];

/** Layer 3: fixed top nav, mix-blend-difference so it inverts legibly
 * over both the dark page and the brighter ambient mesh underneath it. */
export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
      <div className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="font-thin tracking-tighter text-neutral-100 text-lg">
          LAURA
        </Link>
        <nav className="flex items-center gap-8">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-mono text-xs tracking-tight transition-colors ${
                  active ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
