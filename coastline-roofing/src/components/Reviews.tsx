import Image from "next/image";
import { siteConfig, type Review } from "@/config/site";
import { StarIcon } from "./icons";
import { ImageStreamHero } from "./ui/image-stream-hero";

// Real "after" shots from the gallery, used for the photo cards rather than
// stock imagery.
const reviewPhotos = [
  { src: "/images/gallery-after-1.jpg", alt: "New slate tile roof after replacement" },
  { src: "/images/gallery-after-2.jpg", alt: "Flat roof fitted with a new glass roof lantern" },
  { src: "/images/gallery-after-3.jpg", alt: "New tiles and black guttering after replacement" },
  { src: "/images/hero.jpg", alt: "Roofer securing new shingles on a pitched roof" },
];

// A short excerpt reads clearly at the card's native size; the full quote
// is what the review grid below is for.
function excerpt(text: string, max = 60) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function TestimonialStreamCard({ review }: { review: Review }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 border border-warm/10 bg-ink-950 p-4 text-center">
      <div className="flex gap-1 text-gold-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            className={`h-3.5 w-3.5 ${i < review.rating ? "" : "text-warm/15"}`}
          />
        ))}
      </div>
      <p className="font-display text-base leading-snug text-warm italic light:not-italic">
        &ldquo;{excerpt(review.text)}&rdquo;
      </p>
      <p className="text-xs tracking-[0.08em] text-warm/50 uppercase">
        {review.name}
      </p>
    </div>
  );
}

// Alternates one photo, one testimonial, repeating -- the corridor is
// decorative (aria-hidden), the real readable reviews are the grid below.
const streamItems = siteConfig.reviews.flatMap((review, i) => [
  <img
    key={`photo-${i}`}
    src={reviewPhotos[i % reviewPhotos.length].src}
    alt=""
    className="h-full w-full object-cover"
  />,
  <TestimonialStreamCard key={`quote-${i}`} review={review} />,
]);

function SectionIntro() {
  return (
    <>
      <p className="text-xs font-medium tracking-[0.2em] text-gold-400 uppercase">
        Example Reviews — For Demo Purposes
      </p>
      <h2 className="mt-5 font-display text-4xl text-warm sm:text-5xl">
        What customers say
      </h2>
      <p className="mt-5 text-lg font-light text-warm/65">
        Illustrative reviews showing the kind of feedback {siteConfig.name}{" "}
        aims to earn on every job.
      </p>
    </>
  );
}

export function Reviews() {
  return (
    <section id="reviews" className="dark-surface bg-ink-950">
      {/*
        The 3D corridor is tuned for a wide, short banner: its card sizing
        is a percentage of the container's *width*, so on a narrow mobile
        viewport the "large, near" cards never grow past a few dozen
        pixels tall -- nowhere near big enough for the testimonial text to
        read. It genuinely only works from tablet width up, so mobile gets
        a plain, legible stacked list instead of a shrunken version of it.
      */}
      <div className="hidden sm:block">
        <ImageStreamHero items={streamItems} className="h-[420px] bg-ink-950">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/20" />
          <div className="relative z-10 mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-6 text-center">
            <SectionIntro />
          </div>
        </ImageStreamHero>

        <div className="mx-auto max-w-7xl px-6 py-28 sm:py-36 lg:px-8">
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
      </div>

      <div className="px-4 py-28 sm:hidden">
        <div className="mx-auto max-w-md text-center">
          <SectionIntro />
        </div>

        <div className="mt-14 space-y-14">
          {siteConfig.reviews.map((review, i) => {
            const photo = reviewPhotos[i % reviewPhotos.length];
            return (
              <div key={`${review.name}-${review.area}`}>
                <div className="relative aspect-[4/3] overflow-hidden border border-warm/10 light:rounded-[3px]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
                <figure className="mt-5">
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
                  <blockquote className="mt-4 font-display text-lg leading-snug text-warm/90 italic light:not-italic">
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
