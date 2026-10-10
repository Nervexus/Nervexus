import { siteConfig } from "@/config/site";
import { MapPinIcon } from "./icons";

export function AreasCovered() {
  return (
    <section id="areas" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brass-600">
          Areas We Cover
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-950 sm:text-4xl">
          Local roofers for {siteConfig.town} and beyond
        </h2>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {siteConfig.areasCovered.map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-2 rounded-full border border-navy-900/10 bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 shadow-card"
            >
              <MapPinIcon className="h-4 w-4 text-brass-500" />
              {area}
            </span>
          ))}
        </div>

        <p className="mt-8 text-navy-900/60">
          Not sure if we cover your postcode? Give us a call on{" "}
          <a
            href={siteConfig.phone.href}
            className="font-semibold text-navy-950 underline decoration-brass-400 decoration-2 underline-offset-2"
          >
            {siteConfig.phone.display}
          </a>{" "}
          — if we don&apos;t, we&apos;ll point you to someone who does.
        </p>
      </div>
    </section>
  );
}
