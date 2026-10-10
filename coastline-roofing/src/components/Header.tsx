import Link from "next/link";
import { siteConfig } from "@/config/site";
import { PhoneIcon } from "./icons";

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#gallery", label: "Our Work" },
  { href: "#reviews", label: "Reviews" },
  { href: "#areas", label: "Areas" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-cream/10 bg-navy-950/95 backdrop-blur supports-[backdrop-filter]:bg-navy-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brass-500">
            <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
              <path
                d="M32 14 L52 32 H44 V48 H20 V32 H12 Z"
                fill="#0f1b2d"
              />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-cream">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-cream/80 transition-colors hover:text-cream"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={siteConfig.phone.href}
            className="hidden items-center gap-2 text-sm font-semibold text-cream sm:flex"
          >
            <PhoneIcon className="h-4 w-4 text-brass-400" />
            {siteConfig.phone.display}
          </a>
          <a
            href="#quote"
            className="rounded-full bg-brass-500 px-4 py-2 text-sm font-semibold text-navy-950 shadow-card transition-colors hover:bg-brass-600"
          >
            Free Quote
          </a>
        </div>
      </div>
    </header>
  );
}
