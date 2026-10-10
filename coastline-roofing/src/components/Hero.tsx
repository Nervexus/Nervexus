import Image from "next/image";
import { siteConfig } from "@/config/site";
import { MapPinIcon, PhoneIcon } from "./icons";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-navy-950">
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="A roofer securing new shingles on a pitched residential roof"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/80 to-navy-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/40 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-20 sm:pb-28 lg:px-8 lg:pt-28 lg:pb-36">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-cream/5 px-4 py-1.5 text-sm font-medium text-cream/90 backdrop-blur">
            <MapPinIcon className="h-4 w-4 text-brass-400" />
            Proudly covering {siteConfig.town} &amp; the surrounding area
          </div>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight text-cream text-balance sm:text-5xl lg:text-6xl">
            {siteConfig.heroHeadline}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/75 text-balance">
            {siteConfig.heroSubheadline}
          </p>

          <div className="mt-9 flex flex-col gap-3.5 sm:flex-row">
            <a
              href={siteConfig.phone.href}
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-brass-500 px-7 py-4 text-base font-semibold text-navy-950 shadow-card-lg transition-transform hover:scale-[1.02] hover:bg-brass-600 active:scale-[0.99]"
            >
              <PhoneIcon className="h-5 w-5" />
              Call Now — {siteConfig.phone.display}
            </a>
            <a
              href="#quote"
              className="inline-flex items-center justify-center gap-2.5 rounded-full border border-cream/25 bg-cream/5 px-7 py-4 text-base font-semibold text-cream backdrop-blur transition-colors hover:bg-cream/15"
            >
              Get a Free Quote
            </a>
          </div>

          <p className="mt-6 text-sm text-cream/55">
            {siteConfig.yearsExperience}+ years experience · Fully insured ·
            No call-out charge for quotes
          </p>
        </div>
      </div>
    </section>
  );
}
