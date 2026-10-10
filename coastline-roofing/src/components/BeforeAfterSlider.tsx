"use client";

import Image from "next/image";
import { useId, useState } from "react";

type BeforeAfterSliderProps = {
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  caption: string;
};

export function BeforeAfterSlider({
  before,
  after,
  caption,
}: BeforeAfterSliderProps) {
  const [value, setValue] = useState(50);
  const sliderId = useId();

  return (
    <div className="overflow-hidden rounded-2xl border border-navy-900/8 bg-white shadow-card">
      <div className="relative aspect-[4/3] select-none overflow-hidden bg-navy-900">
        <Image
          src={after.src}
          alt={after.alt}
          fill
          sizes="(min-width: 1024px) 420px, 100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        >
          <Image
            src={before.src}
            alt={before.alt}
            fill
            sizes="(min-width: 1024px) 420px, 100vw"
            className="object-cover"
          />
        </div>

        {/* Divider line + handle, purely visual */}
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(12,31,61,0.25)]"
          style={{ left: `${value}%` }}
        >
          <span className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy-900 shadow-card">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                d="M9 7 4 12l5 5M15 7l5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-navy-950/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          Before
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-orange-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          After
        </span>

        <label htmlFor={sliderId} className="sr-only">
          Drag to compare before and after for {caption}
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0"
        />
      </div>
      <p className="px-5 py-4 text-sm font-semibold text-navy-900">
        {caption}
      </p>
    </div>
  );
}
