import { siteConfig } from "@/config/site";
import { ServicesCarousel } from "./ServicesCarousel";

export function Services() {
  return (
    <section id="services" className="bg-ink-900 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-gold-500 uppercase">
            What We Do
          </p>
          <h2 className="mt-5 font-display text-4xl text-warm sm:text-5xl">
            Roofing services across {siteConfig.town}
          </h2>
          <p className="mt-5 text-lg font-light text-warm/55">
            From a single slipped tile to a full re-roof, our team handles
            every job with the same attention to detail.
          </p>
        </div>

        <ServicesCarousel services={siteConfig.services} />
      </div>
    </section>
  );
}
