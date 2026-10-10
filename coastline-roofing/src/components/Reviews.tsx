import { siteConfig } from "@/config/site";
import { StarIcon } from "./icons";

export function Reviews() {
  return (
    <section id="reviews" className="bg-ink-950 py-28 sm:py-36">
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

        <div className="mt-20 grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
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
              <blockquote className="mt-5 flex-1 font-display text-lg leading-snug text-warm/90 italic">
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
