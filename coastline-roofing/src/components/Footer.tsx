import { siteConfig } from "@/config/site";
import { MailIcon, MapPinIcon, PhoneIcon } from "./icons";

// Computed once at build time (module scope), not per-render — keeps this
// page fully static instead of forcing a dynamic/request-time render.
const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="bg-navy-950 pt-16 pb-28 text-white/70 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
                <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M32 14 L52 32 H44 V48 H20 V32 H12 Z"
                    fill="#0c1f3d"
                  />
                </svg>
              </span>
              <span className="font-display text-lg font-bold text-white">
                {siteConfig.name}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              {siteConfig.tagline}. Local, fully insured, and straightforward
              to deal with.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={siteConfig.phone.href}
                  className="flex items-center gap-2.5 hover:text-white"
                >
                  <PhoneIcon className="h-4 w-4 text-orange-400" />
                  {siteConfig.phone.display}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-center gap-2.5 hover:text-white"
                >
                  <MailIcon className="h-4 w-4 text-orange-400" />
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                <span>
                  {siteConfig.address.line1}
                  <br />
                  {siteConfig.address.line2}, {siteConfig.address.postcode}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
              Services
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {siteConfig.services.map((service) => (
                <li key={service.title}>
                  <a href="#services" className="hover:text-white">
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
              Areas Covered
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {siteConfig.areasCovered.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>Demo site — business details shown are fictional.</p>
        </div>
      </div>
    </footer>
  );
}
