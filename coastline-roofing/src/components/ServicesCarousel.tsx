"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Service } from "@/config/site";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, serviceIcons } from "./icons";

const AUTOPLAY_MS = 5000;
const VISIBLE_RADIUS = 2;

// How far a card at a given offset from the active one sits, scales, and
// fades. Offset is signed and wraps (the card "opposite" the active one in
// the ring is always hidden), so stepping past the last card glides
// straight into the first -- there's no edge to hit and no position to
// reset, which is what makes the loop seamless in both directions.
function layout(offset: number) {
  const abs = Math.abs(offset);
  if (abs > VISIBLE_RADIUS) {
    return { x: Math.sign(offset) * 640, scale: 0.6, opacity: 0, zIndex: 0 };
  }
  return {
    x: offset * 260,
    scale: 1 - abs * 0.14,
    opacity: abs === 0 ? 1 : 1 - abs * 0.38,
    zIndex: 10 - abs,
  };
}

function signedOffset(index: number, active: number, count: number) {
  const raw = ((index - active) % count + count) % count;
  return raw > count / 2 ? raw - count : raw;
}

export function ServicesCarousel({
  services,
}: {
  services: readonly Service[];
}) {
  const count = services.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function go(direction: 1 | -1) {
    setActive((i) => (i + direction + count) % count);
  }

  useEffect(() => {
    if (paused) return;
    timer.current = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  }

  return (
    <div
      className="mt-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-8 flex justify-center gap-3 sm:justify-end">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous service"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-warm/20 text-warm transition-colors hover:border-gold-500 hover:text-gold-500"
        >
          <ChevronRightIcon className="h-4 w-4 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next service"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-warm/20 text-warm transition-colors hover:border-gold-500 hover:text-gold-500"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <motion.div
        role="group"
        aria-label="Our services"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) go(1);
          else if (info.offset.x > 60) go(-1);
        }}
        className="relative flex h-[320px] touch-pan-y items-center justify-center overflow-hidden outline-none sm:h-[360px]"
      >
        {services.map((service, i) => {
          const offset = signedOffset(i, active, count);
          const { x, scale, opacity, zIndex } = layout(offset);
          const Icon = serviceIcons[service.icon];
          const isActive = offset === 0;

          return (
            <motion.button
              key={service.title}
              type="button"
              aria-label={`Show ${service.title}`}
              aria-current={isActive}
              tabIndex={-1}
              onClick={() => !isActive && setActive(i)}
              animate={{ x, scale, opacity, zIndex }}
              initial={false}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className={cn(
                "absolute w-[78vw] shrink-0 border border-warm/10 bg-ink-950 p-8 text-left sm:w-[340px]",
                isActive ? "cursor-default" : "cursor-pointer"
              )}
              style={{ pointerEvents: Math.abs(offset) > VISIBLE_RADIUS ? "none" : "auto" }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/40 text-gold-500">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-xl text-warm">
                {service.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed font-light text-warm/55">
                {service.description}
              </p>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="mt-8 flex justify-center gap-2">
        {services.map((service, i) => (
          <button
            key={service.title}
            type="button"
            aria-label={`Go to ${service.title}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === active ? "w-6 bg-gold-500" : "w-1.5 bg-warm/20"
            )}
          />
        ))}
      </div>
    </div>
  );
}
