"use client";

import { useRef } from "react";
import type { Service } from "@/config/site";
import { ChevronRightIcon } from "./icons";

export function ServicesCarousel({
  services,
}: {
  services: readonly Service[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const gap = 24;
    const amount = card ? card.offsetWidth + gap : 320;
    el.scrollBy({ left: amount * direction, behavior: "smooth" });
  }

  return (
    <div className="mt-14">
      <div className="mb-8 flex justify-center gap-3 sm:justify-end">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous service"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-warm/20 text-warm transition-colors hover:border-gold-500 hover:text-gold-500"
        >
          <ChevronRightIcon className="h-4 w-4 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Next service"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-warm/20 text-warm transition-colors hover:border-gold-500 hover:text-gold-500"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        {services.map((service, index) => (
          <div
            key={service.title}
            data-card
            className="w-[78vw] shrink-0 snap-start border border-warm/10 bg-ink-950 p-8 sm:w-[340px]"
          >
            <span className="font-display text-sm text-gold-500">
              {String(index + 1).padStart(2, "0")}
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
