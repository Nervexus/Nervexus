import { siteConfig } from "@/config/site";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

export function Gallery() {
  return (
    <section id="gallery" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brass-600">
            Our Work
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-950 sm:text-4xl">
            See the difference, drag to compare
          </h2>
          <p className="mt-4 text-lg text-navy-900/65">
            A few examples of the kind of transformation a proper roofing job
            makes. Drag the slider on each photo to compare.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.gallery.map((item) => (
            <BeforeAfterSlider
              key={item.caption}
              before={item.before}
              after={item.after}
              caption={item.caption}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
