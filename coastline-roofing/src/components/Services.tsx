import { siteConfig } from "@/config/site";
import { serviceIcons } from "./icons";

export function Services() {
  return (
    <section id="services" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brass-600">
            What We Do
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-950 sm:text-4xl">
            Roofing services across {siteConfig.town}
          </h2>
          <p className="mt-4 text-lg text-navy-900/65">
            From a single slipped tile to a full re-roof, our team handles
            every job with the same attention to detail.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.services.map((service) => {
            const Icon = serviceIcons[service.icon];
            return (
              <div
                key={service.title}
                className="group rounded-2xl border border-navy-900/8 bg-white p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-lg"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-950 text-brass-400 transition-colors group-hover:bg-brass-500 group-hover:text-navy-950">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-navy-950">
                  {service.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-navy-900/65">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
