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
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="#top" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brass-400/60 text-brass-400">
            <span className="font-display text-base italic">C</span>
          </span>
          <span className="font-display text-xl tracking-tight text-cream">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-medium tracking-[0.14em] text-cream/65 uppercase transition-colors hover:text-cream"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <a
            href={siteConfig.phone.href}
            className="hidden items-center gap-2 text-sm text-cream sm:flex"
          >
            <PhoneIcon className="h-4 w-4 text-brass-400" />
            {siteConfig.phone.display}
          </a>
          <a
            href="#quote"
            className="border border-brass-500 px-5 py-2.5 text-xs font-medium tracking-[0.12em] text-brass-400 uppercase transition-colors hover:bg-brass-500 hover:text-navy-950"
          >
            Free Quote
          </a>
        </div>
      </div>
    </header>
  );
}
