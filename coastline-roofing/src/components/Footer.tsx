import { siteConfig } from "@/config/site";
import { MailIcon, MapPinIcon, PhoneIcon } from "./icons";

// Computed once at build time (module scope), not per-render — keeps this
// page fully static instead of forcing a dynamic/request-time render.
const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="bg-ink-950 pt-20 pb-28 text-warm/70 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/60 text-gold-400">
                <span className="font-display text-base italic">C</span>
              </span>
              <span className="font-display text-xl text-warm">
                {siteConfig.name}
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed font-light">
              {siteConfig.tagline}. Local, fully insured, and straightforward
              to deal with.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium tracking-[0.14em] text-warm/40 uppercase">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={siteConfig.phone.href}
                  className="flex items-center gap-2.5 hover:text-warm"
                >
                  <PhoneIcon className="h-4 w-4 text-gold-400" />
                  {siteConfig.phone.display}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-center gap-2.5 hover:text-warm"
                >
                  <MailIcon className="h-4 w-4 text-gold-400" />
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <span>
                  {siteConfig.address.line1}
                  <br />
                  {siteConfig.address.line2}, {siteConfig.address.postcode}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium tracking-[0.14em] text-warm/40 uppercase">
              Services
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {siteConfig.services.map((service) => (
                <li key={service.title}>
                  <a href="#services" className="hover:text-warm">
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium tracking-[0.14em] text-warm/40 uppercase">
              Areas Covered
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {siteConfig.areasCovered.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-warm/10 pt-8 text-xs text-warm/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>Demo site — business details shown are fictional.</p>
        </div>
      </div>
    </footer>
  );
}
