"use client";

import { useEffect, useState } from "react";
import { siteConfig, type Review } from "@/config/site";
import { CloseIcon, StarIcon } from "./icons";
import { ImageStreamHero } from "./ui/image-stream-hero";

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <div className={`flex gap-0.5 text-gold-400 ${className}`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          className={`h-3.5 w-3.5 ${index < rating ? "" : "text-warm/15"}`}
        />
      ))}
    </div>
  );
}

// A short excerpt reads clearly at the card's native size; tapping the card
// opens the full review.
function excerpt(text: string, max = 70) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

// Purely decorative -- the corridor's deep 3D transforms (perspective +
// preserve-3d + per-card rotateY) make real click hit-testing unreliable in
// every browser tested: a tap can land on the flat wrapper instead of the
// visually front-most card. The actual "tap to read" interaction lives on
// the grid below instead, where hit-testing is just normal flow layout.
function TestimonialStreamCard({ review }: { review: Review }) {
  return (
    <div className="dark-surface flex h-full w-full flex-col items-center justify-center gap-3 border border-warm/10 bg-ink-950 p-4 text-center">
      <Stars rating={review.rating} />
      <p className="font-display text-base leading-snug text-warm italic light:not-italic">
        &ldquo;{excerpt(review.text)}&rdquo;
      </p>
      <p className="text-xs tracking-[0.08em] text-warm/50 uppercase">
        {review.name}
      </p>
    </div>
  );
}

function ReviewDialog({ review, onClose }: { review: Review; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Review from ${review.name}`}
        onClick={(event) => event.stopPropagation()}
        className="dark-surface relative w-full max-w-md border border-warm/10 bg-ink-950 p-8 light:rounded-[3px]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 text-warm/50 transition-colors hover:text-warm"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
        <Stars rating={review.rating} className="h-4 w-4" />
        <blockquote className="mt-5 font-display text-lg leading-snug text-warm italic light:not-italic">
          &ldquo;{review.text}&rdquo;
        </blockquote>
        <p className="mt-6 text-xs tracking-[0.08em] text-warm/50 uppercase">
          {review.name} · {review.area}
        </p>
      </div>
    </div>
  );
}

export function Reviews() {
  const [openReview, setOpenReview] = useState<Review | null>(null);

  const streamItems = siteConfig.reviews.map((review) => (
    <TestimonialStreamCard key={`${review.name}-${review.area}`} review={review} />
  ));

  return (
    <section id="reviews" className="dark-surface bg-ink-950">
      <div className="mx-auto max-w-2xl px-4 pt-28 text-center sm:px-6 sm:pt-36">
        <h2 className="font-display text-4xl text-warm sm:text-5xl">
          What customers say
        </h2>
        <p className="mt-5 text-lg font-light text-warm/65">
          Illustrative reviews showing the kind of feedback {siteConfig.name}{" "}
          aims to earn on every job — tap a card below to read it in full.
        </p>
      </div>

      {/*
        The corridor's card sizing is a percentage of the container's width,
        so on a narrow phone screen the cards never grow large enough for
        the text to read -- it ends up as the jumbled cluster seen on
        mobile. It only works from tablet width up, so it's hidden below
        that instead of showing a shrunken, illegible version of itself.
      */}
      <ImageStreamHero
        items={streamItems}
        className="mt-16 hidden h-[420px] bg-ink-950 sm:block"
      />

      <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
        <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.reviews.map((review) => (
            <button
              type="button"
              key={`${review.name}-${review.area}`}
              onClick={() => setOpenReview(review)}
              aria-label={`Read the full review from ${review.name}`}
              className="flex flex-col border-t border-warm/15 pt-6 text-left transition-colors hover:border-gold-500"
            >
              <Stars rating={review.rating} />
              <blockquote className="mt-5 flex-1 font-display text-lg leading-snug text-warm/90 italic light:not-italic">
                &ldquo;{excerpt(review.text, 90)}&rdquo;
              </blockquote>
              <p className="mt-6 text-xs tracking-[0.08em] text-gold-500 uppercase">
                Read in full
              </p>
              <figcaption className="mt-2 text-xs tracking-[0.08em] text-warm/45 uppercase">
                {review.name} · {review.area}
              </figcaption>
            </button>
          ))}
        </div>
      </div>

      {openReview && (
        <ReviewDialog review={openReview} onClose={() => setOpenReview(null)} />
      )}
    </section>
  );
}
