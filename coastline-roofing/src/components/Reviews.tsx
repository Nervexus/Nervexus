import { siteConfig } from "@/config/site";
import { StarIcon } from "./icons";

export function Reviews() {
  return (
    <section id="reviews" className="bg-navy-950 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/70">
            Example reviews — for demo purposes
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            What customers say
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Illustrative reviews showing the kind of feedback {siteConfig.name}{" "}
            aims to earn on every job.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.reviews.map((review) => (
            <figure
              key={`${review.name}-${review.area}`}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex gap-0.5 text-orange-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon
                    key={index}
                    className={`h-4 w-4 ${
                      index < review.rating ? "" : "text-white/15"
                    }`}
                  />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-white/80">
                &ldquo;{review.text}&rdquo;
              </blockquote>
              <figcaption className="mt-5 text-sm font-semibold text-white">
                {review.name}
                <span className="font-normal text-white/50"> · {review.area}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
