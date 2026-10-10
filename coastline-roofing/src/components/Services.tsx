import { siteConfig } from "@/config/site";

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

        <div className="mt-20 grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.services.map((service, index) => (
            <div key={service.title} className="border-t border-warm/15 pt-6">
              <span className="font-display text-sm text-gold-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl text-warm">
                {service.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed font-light text-warm/55">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
