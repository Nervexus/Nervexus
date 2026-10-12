import { siteConfig } from "@/config/site";
import { trustIcons } from "./icons";

export function TrustBar() {
  return (
    <section className="dark-surface bg-ink-950">
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {siteConfig.trustPoints.map((point, index) => {
          const isLeftCol = index % 2 === 0;
          const isTopRow = index < 2;
          const Icon = trustIcons[point.icon];
          return (
            <div
              key={point.caption}
              className={[
                "border-warm/10 px-6 py-10 sm:px-8",
                isLeftCol ? "border-r lg:border-r-0" : "",
                isTopRow ? "border-b lg:border-b-0" : "",
                index > 0 ? "lg:border-l" : "",
              ].join(" ")}
            >
              <Icon className="h-5 w-5 text-gold-400" />
              <p className="mt-4 font-display text-2xl text-warm sm:text-3xl">
                {point.stat}
              </p>
              <p className="mt-1.5 text-xs tracking-[0.1em] text-warm/45 uppercase">
                {point.caption}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
