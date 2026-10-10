import { siteConfig } from "@/config/site";
import { trustIcons } from "./icons";

export function TrustBar() {
  return (
    <section className="border-b border-navy-900/5 bg-cream">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:gap-8 lg:px-8">
        {siteConfig.trustPoints.map((point) => {
          const Icon = trustIcons[point.icon];
          return (
            <div key={point.label} className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brass-500/10 text-brass-600">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold leading-tight text-navy-900 sm:text-base">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
