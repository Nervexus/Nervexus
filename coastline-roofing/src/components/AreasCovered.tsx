import { siteConfig } from "@/config/site";

export function AreasCovered() {
  return (
    <section id="areas" className="bg-ink-900 py-28 sm:py-36">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-medium tracking-[0.2em] text-gold-500 uppercase">
          Areas We Cover
        </p>
        <h2 className="mt-5 font-display text-4xl text-warm sm:text-5xl">
          Local roofers for {siteConfig.town} and beyond
        </h2>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-4 font-display text-xl text-warm sm:text-2xl">
          {siteConfig.areasCovered.map((area, index) => (
            <span key={area} className="flex items-center gap-3">
              {index > 0 && (
                <span className="text-gold-400" aria-hidden="true">
                  ·
                </span>
              )}
              {area}
            </span>
          ))}
        </div>

        <p className="mt-12 text-warm/55">
          Not sure if we cover your postcode? Give us a call on{" "}
          <a
            href={siteConfig.phone.href}
            className="text-warm underline decoration-gold-400 decoration-1 underline-offset-4"
          >
            {siteConfig.phone.display}
          </a>{" "}
          — if we don&apos;t, we&apos;ll point you to someone who does.
        </p>
      </div>
    </section>
  );
}
