"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

/** Runs the shared `.gsap-entrance` stagger reveal (y: 24 -> 0, opacity:
 * 0 -> 1, power4.out) over everything inside it, once per mount -- i.e.
 * once per page, since each route is a fresh instance of this wrapper. */
export function GsapEntrance({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(".gsap-entrance");
    const entrance = gsap.fromTo(
      targets,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "power4.out" }
    );

    const dots = el.querySelectorAll(".pulse-dot");
    const pulse = gsap.to(dots, {
      opacity: 0.25,
      duration: 1.1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    return () => {
      entrance.kill();
      pulse.kill();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
