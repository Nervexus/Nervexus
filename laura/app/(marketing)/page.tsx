"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import { GsapEntrance } from "@/components/GsapEntrance";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";

const HERO_WORDS = ["We", "design", "at", "the", "pixel", "level."];
const GRADIENT_WORDS = new Set(["pixel", "level."]);
const GRADIENT_FILL = "linear-gradient(135deg, #ffffff, #a3a3a3, #525252)";

const METRICS = [
  { id: "metric-1", value: "120+", label: "Projects shipped" },
  { id: "metric-2", value: "8", label: "Years in practice" },
  { id: "metric-3", value: "40+", label: "Global clients" },
];

const PORTFOLIO = [
  {
    icon: "solar:pallete-2-linear",
    title: "Brand Identity",
    description: "Visual systems and identity design for ambitious brands.",
  },
  {
    icon: "solar:smartphone-update-linear",
    title: "Product Design",
    description: "Mobile and web interfaces engineered for clarity.",
  },
  {
    icon: "solar:chart-square-linear",
    title: "Growth & Strategy",
    description: "Data-driven design decisions that move the needle.",
  },
  {
    icon: "solar:video-frame-linear",
    title: "Motion & Film",
    description: "Motion design and film direction for launch moments.",
  },
];

const PROCESS = [
  { n: "01", title: "Discover", description: "Understanding your goals, users, and constraints." },
  { n: "02", title: "Design", description: "Iterating from concept to pixel-perfect execution." },
  { n: "03", title: "Deliver", description: "Shipping polished, production-ready experiences." },
];

/** The Hero H1 is injected via JS -- each word split into an
 * overflow-hidden mask containing an inner span, then GSAP-revealed
 * bottom-to-top. React never owns this subtree's children. */
function useHeroReveal(ref: React.RefObject<HTMLHeadingElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.innerHTML = "";
    const inners: HTMLSpanElement[] = [];
    HERO_WORDS.forEach((word, i) => {
      const mask = document.createElement("span");
      mask.className = "inline-block overflow-hidden pb-[0.1em]";
      const inner = document.createElement("span");
      inner.className = "inline-block will-change-transform";
      inner.textContent = word;
      if (GRADIENT_WORDS.has(word)) {
        inner.style.backgroundImage = GRADIENT_FILL;
        inner.style.backgroundClip = "text";
        inner.style.webkitBackgroundClip = "text";
        inner.style.color = "transparent";
      }
      mask.appendChild(inner);
      el.appendChild(mask);
      inners.push(inner);
      if (i < HERO_WORDS.length - 1) {
        el.appendChild(document.createTextNode(" "));
      }
    });

    const tween = gsap.fromTo(
      inners,
      { yPercent: 110 },
      { yPercent: 0, duration: 1, stagger: 0.07, ease: "power4.out", delay: 0.15 }
    );
    return () => {
      tween.kill();
    };
  }, [ref]);
}

export default function Home() {
  const heroRef = useRef<HTMLHeadingElement>(null);
  useHeroReveal(heroRef);

  return (
    <GsapEntrance>
      {/* SECTION 2 -- Hero */}
      <section className="flex min-h-[calc(100vh-11rem)] flex-col items-center justify-center gap-10 px-6 text-center">
        <Pill dotId="pulse-dot" className="gsap-entrance">
          Available for projects
        </Pill>

        <h1
          ref={heroRef}
          className="flex flex-wrap items-center justify-center gap-x-[0.25em] gap-y-1 text-center text-6xl font-thin leading-[0.95] tracking-tight text-neutral-100 sm:text-7xl md:text-8xl"
        />

        <Link href="/laura" className="gsap-entrance">
          <Button withArrow>Talk to Laura</Button>
        </Link>

        <div className="mt-10 grid grid-cols-3 gap-2 gsap-entrance sm:gap-6">
          {METRICS.map((m, i) => (
            <div key={m.id} className="relative flex flex-col items-center gap-1.5 px-4 sm:px-8">
              {i > 0 && (
                <span
                  className="absolute left-0 top-1/2 h-16 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-neutral-800 to-transparent"
                  aria-hidden="true"
                />
              )}
              <span id={m.id} className="metric-gradient-text font-mono text-3xl sm:text-4xl">
                {m.value}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-600">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 -- Portfolio */}
      <section className="mx-auto max-w-5xl px-6 py-28">
        <div className="gsap-entrance mb-12 flex items-end justify-between gap-4">
          <h2 className="font-thin text-3xl tracking-tight text-neutral-100 sm:text-4xl">Selected work</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-600">
            2018 — 2026
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PORTFOLIO.map((card) => (
            <div
              key={card.title}
              className="gradient-border gsap-entrance group relative rounded-2xl border border-neutral-800/60 bg-neutral-900/40 p-7 backdrop-blur-md transition-transform duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between">
                <iconify-icon
                  icon={card.icon}
                  className="text-3xl text-neutral-300 transition-transform duration-300 group-hover:scale-105"
                />
                <iconify-icon
                  icon="solar:arrow-right-up-linear"
                  className="text-lg text-neutral-600 transition-colors group-hover:text-neutral-300"
                />
              </div>
              <h3 className="mt-8 text-lg font-light text-neutral-100">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 -- Process */}
      <section className="mx-auto max-w-5xl px-6 py-28">
        <h2 className="gsap-entrance mb-12 font-thin text-3xl tracking-tight text-neutral-100 sm:text-4xl">
          How it works
        </h2>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {PROCESS.map((step) => (
            <div key={step.n} className="gsap-entrance">
              <span className="font-mono text-5xl font-light text-neutral-700">{step.n}</span>
              <h3 className="mt-5 text-lg font-light text-neutral-100">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </GsapEntrance>
  );
}
