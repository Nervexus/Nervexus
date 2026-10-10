import { siteConfig } from "@/config/site";

export function TrustBar() {
  return (
    <section className="bg-navy-950">
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {siteConfig.trustPoints.map((point, index) => {
          const isLeftCol = index % 2 === 0;
          const isTopRow = index < 2;
          return (
            <div
              key={point.label}
              className={[
                "border-cream/10 px-6 py-8 text-center sm:px-8",
                isLeftCol ? "border-r lg:border-r-0" : "",
                isTopRow ? "border-b lg:border-b-0" : "",
                index > 0 ? "lg:border-l" : "",
              ].join(" ")}
            >
              <p className="font-display text-base text-cream sm:text-lg">
                {point.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
