"use client";

import { useLayoutEffect, useRef } from "react";
import type { Service } from "@/config/site";
import { ChevronRightIcon } from "./icons";

// A genuinely endless carousel. The real cards are repeated three times in
// a row; we always sit in the middle copy and scroll smoothly, one card at
// a time, by button, swipe, or drag. The moment a scroll settles outside
// that middle copy, we silently shift the scroll position by exactly one
// copy's width -- identical content, so the jump is invisible -- landing
// back in the middle. A single extra copy on each side (rather than a
// single cloned card) leaves enough room that the browser never has to
// clamp a step short right at the edge, which is what caused visible
// skips when only one clone card sat on either end.
export function ServicesCarousel({
  services,
}: {
  services: readonly Service[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const count = services.length;
  const tripled = [...services, ...services, ...services];
  const safeMin = count;
  const safeMax = count * 2 - 1;

  function relativeLeft(card: HTMLElement, el: HTMLElement) {
    return (
      card.getBoundingClientRect().left -
      el.getBoundingClientRect().left +
      el.scrollLeft
    );
  }

  function getCards(el: HTMLDivElement) {
    return Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
  }

  function closestIndex(el: HTMLDivElement, cards: HTMLElement[]) {
    let index = 0;
    let smallestDiff = Infinity;
    cards.forEach((card, i) => {
      const diff = Math.abs(relativeLeft(card, el) - el.scrollLeft);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        index = i;
      }
    });
    return index;
  }

  // Position at the start of the middle copy before the browser paints, so
  // visitors never see the leading copy flash by on load.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const cards = getCards(el);
    const target = cards[safeMin];
    if (target) {
      el.scrollLeft = relativeLeft(target, el);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After any scroll (button-triggered, or a swipe/drag) comes to rest,
  // check whether we've drifted into the leading or trailing copy and, if
  // so, jump back into the middle copy by exactly one copy-width. Same
  // content either side, so nothing visibly changes.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let settleTimer: ReturnType<typeof setTimeout>;

    function settle() {
      const current = scrollerRef.current;
      if (!current) return;
      const cards = getCards(current);
      const index = closestIndex(current, cards);

      if (index < safeMin) {
        const target = cards[index + count];
        if (target) current.scrollLeft = relativeLeft(target, current);
      } else if (index > safeMax) {
        const target = cards[index - count];
        if (target) current.scrollLeft = relativeLeft(target, current);
      }
    }

    function handleScroll() {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 120);
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      clearTimeout(settleTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Steps to the adjacent card by targeting its exact position rather than
  // a blind pixel offset, so every click is a true single-card move.
  function step(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const cards = getCards(el);
    if (cards.length === 0) return;

    const currentIndex = closestIndex(el, cards);
    const targetIndex = Math.max(
      0,
      Math.min(cards.length - 1, currentIndex + direction)
    );
    el.scrollTo({
      left: relativeLeft(cards[targetIndex], el),
      behavior: "smooth",
    });
  }

  return (
    <div className="mt-14">
      <div className="mb-8 flex justify-center gap-3 sm:justify-end">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous service"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-warm/20 text-warm transition-colors hover:border-gold-500 hover:text-gold-500"
        >
          <ChevronRightIcon className="h-4 w-4 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next service"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-warm/20 text-warm transition-colors hover:border-gold-500 hover:text-gold-500"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        {tripled.map((service, i) => (
          <div
            key={`${service.title}-${i}`}
            data-card
            className="w-[78vw] shrink-0 snap-start border border-warm/10 bg-ink-950 p-8 sm:w-[340px]"
          >
            <span className="font-display text-sm text-gold-500">
              {String((i % count) + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 font-display text-xl text-warm">
              {service.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed font-light text-warm/55">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
