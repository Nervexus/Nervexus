import { siteConfig } from "@/config/site";
import { StarIcon } from "./icons";
import { ImageStreamHero } from "./ui/image-stream-hero";

// Real job photos already used elsewhere on the site (hero + before/after
// gallery), reused here for the testimonials banner's image corridor rather
// than inventing or hotlinking anything new.
const streamImages = [
  { src: "/images/hero.jpg", alt: "Roofer securing new shingles on a pitched roof" },
  { src: "/images/gallery-after-1.jpg", alt: "New slate tile roof after replacement" },
  { src: "/images/gallery-before-2.jpg", alt: "A plain flat roof before a roof lantern was fitted" },
  { src: "/images/gallery-after-3.jpg", alt: "New tiles and black guttering after replacement" },
  { src: "/images/gallery-before-1.jpg", alt: "Aged, moss-covered shingle roof before replacement" },
  { src: "/images/gallery-after-2.jpg", alt: "Flat roof fitted with a new glass roof lantern" },
  { src: "/images/gallery-before-3.jpg", alt: "Rusted old guttering before replacement" },
];

export function Reviews() {
  return (
    <section id="reviews" className="dark-surface bg-ink-950">
      <div className="mx-auto max-w-2xl px-4 pt-28 text-center sm:px-6 sm:pt-36">
        <h2 className="font-display text-4xl text-warm sm:text-5xl">
          What customers say
        </h2>
        <p className="mt-5 text-lg font-light text-warm/65">
          Illustrative reviews showing the kind of feedback {siteConfig.name}{" "}
          aims to earn on every job.
        </p>
      </div>

      <ImageStreamHero
        images={streamImages}
        className="mt-16 h-[340px] bg-ink-950 sm:h-[420px]"
      />

      <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
        <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.reviews.map((review) => (
            <figure
              key={`${review.name}-${review.area}`}
              className="flex flex-col border-t border-warm/15 pt-6"
            >
              <div className="flex gap-0.5 text-gold-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon
                    key={index}
                    className={`h-3.5 w-3.5 ${
                      index < review.rating ? "" : "text-warm/15"
                    }`}
                  />
                ))}
              </div>
              <blockquote className="mt-5 flex-1 font-display text-lg leading-snug text-warm/90 italic light:not-italic">
                &ldquo;{review.text}&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-xs tracking-[0.08em] text-warm/45 uppercase">
                {review.name} · {review.area}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
