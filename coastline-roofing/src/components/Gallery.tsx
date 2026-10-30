import { siteConfig } from "@/config/site";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

export function Gallery() {
  return (
    <section id="gallery" className="bg-ink-900 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-gold-500 uppercase">
            Our Work
          </p>
          <h2 className="mt-5 font-display text-4xl text-warm sm:text-5xl">
            See the difference, drag to compare
          </h2>
          <p className="mt-5 text-lg font-light text-warm/55">
            A few examples of the kind of transformation a proper roofing job
            makes. Drag the slider on each photo to compare.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
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
