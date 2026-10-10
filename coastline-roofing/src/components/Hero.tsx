import Image from "next/image";
import { siteConfig } from "@/config/site";
import { PhoneIcon } from "./icons";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="A roofer securing new shingles on a pitched residential roof"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/90 to-ink-950/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/60 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-24 sm:px-6 sm:pt-28 sm:pb-32 lg:px-8 lg:pt-36 lg:pb-44">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 text-xs font-medium tracking-[0.2em] text-gold-400 uppercase">
            <span className="h-px w-10 bg-gold-400/60" />
            {siteConfig.town}, {siteConfig.county}
          </div>

          <h1 className="mt-8 font-display text-5xl leading-[1.08] text-warm text-balance sm:text-6xl lg:text-7xl">
            {siteConfig.heroHeadline}
          </h1>

          <p className="mt-7 max-w-lg text-lg leading-relaxed font-light text-warm/65 text-balance">
            {siteConfig.heroSubheadline}
          </p>

          <div className="mt-11 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <a
              href={siteConfig.phone.href}
              className="inline-flex items-center justify-center gap-3 bg-gold-500 px-8 py-4 text-xs font-medium tracking-[0.14em] text-ink-950 uppercase transition-colors hover:bg-gold-400"
            >
              <PhoneIcon className="h-4 w-4" />
              Call Now
            </a>
            <a
              href="#quote"
              className="group inline-flex items-center gap-2 text-sm text-warm"
            >
              Get a Free Quote
              <span className="h-px w-6 bg-gold-400 transition-all group-hover:w-9" />
            </a>
          </div>

          <p className="mt-16 text-xs tracking-[0.08em] text-warm/40">
            {siteConfig.yearsExperience}+ Years Experience&nbsp; · &nbsp;Fully
            Insured&nbsp; · &nbsp;No Call-Out Charge For Quotes
          </p>
        </div>
      </div>
    </section>
  );
}
