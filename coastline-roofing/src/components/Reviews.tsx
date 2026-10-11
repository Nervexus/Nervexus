import Image from "next/image";
import { siteConfig } from "@/config/site";
import { StarIcon } from "./icons";

// Real "after" shots from the gallery, paired one-to-one with a review so
// each testimonial sits next to a photo of the kind of finished job it's
// talking about, rather than a generic stock image.
const reviewPhotos = [
  { src: "/images/gallery-after-1.jpg", alt: "New slate tile roof after replacement" },
  { src: "/images/gallery-after-2.jpg", alt: "Flat roof fitted with a new glass roof lantern" },
  { src: "/images/gallery-after-3.jpg", alt: "New tiles and black guttering after replacement" },
  { src: "/images/hero.jpg", alt: "Roofer securing new shingles on a pitched roof" },
];

export function Reviews() {
  return (
    <section id="reviews" className="dark-surface bg-ink-950 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-gold-400 uppercase">
            Example Reviews — For Demo Purposes
          </p>
          <h2 className="mt-5 font-display text-4xl text-warm sm:text-5xl">
            What customers say
          </h2>
          <p className="mt-5 text-lg font-light text-warm/55">
            Illustrative reviews showing the kind of feedback {siteConfig.name}{" "}
            aims to earn on every job.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-16">
          {siteConfig.reviews.map((review, index) => {
            const photo = reviewPhotos[index % reviewPhotos.length];
            return (
              <div
                key={`${review.name}-${review.area}`}
                className="grid grid-cols-2 gap-5 sm:gap-6"
              >
                <div className="relative aspect-[4/5] overflow-hidden border border-warm/10 light:rounded-[3px]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 220px, 40vw"
                    className="object-cover"
                  />
                </div>

                <figure className="flex flex-col justify-center">
                  <div className="flex gap-0.5 text-gold-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < review.rating ? "" : "text-warm/15"
                        }`}
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 font-display text-base leading-snug text-warm/90 italic light:not-italic sm:text-lg">
                    &ldquo;{review.text}&rdquo;
                  </blockquote>
                  <figcaption className="mt-4 text-xs tracking-[0.08em] text-warm/45 uppercase">
                    {review.name} · {review.area}
                  </figcaption>
                </figure>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
