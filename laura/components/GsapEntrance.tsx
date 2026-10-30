"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

/** Runs the shared `.gsap-entrance` stagger reveal (y: 24 -> 0, opacity:
 * 0 -> 1, power4.out) and the `.pulse-dot` pulse over everything inside it.
 * Watches for elements added after the initial mount (list items that
 * only exist once an async fetch resolves -- shifts, bookings, content
 * ideas, settings cards) via a MutationObserver, since `.gsap-entrance`
 * pre-sets opacity: 0 in CSS and anything never picked up by a tween
 * would otherwise stay invisible forever. */
export function GsapEntrance({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const maybeEl = ref.current;
    if (!maybeEl) return;
    const el: HTMLDivElement = maybeEl;

    const animated = new WeakSet<Element>();
    const pulsed = new WeakSet<Element>();
    const tweens: gsap.core.Tween[] = [];

    function reveal(targets: Element[]) {
      const fresh = targets.filter((t) => !animated.has(t));
      if (fresh.length === 0) return;
      fresh.forEach((t) => animated.add(t));
      tweens.push(
        gsap.fromTo(
          fresh,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "power4.out" }
        )
      );
    }

    function pulse(targets: Element[]) {
      const fresh = targets.filter((t) => !pulsed.has(t));
      if (fresh.length === 0) return;
      fresh.forEach((t) => pulsed.add(t));
      tweens.push(
        gsap.to(fresh, { opacity: 0.25, duration: 1.1, repeat: -1, yoyo: true, ease: "sine.inOut" })
      );
    }

    function scan() {
      reveal(Array.from(el.querySelectorAll(".gsap-entrance")));
      pulse(Array.from(el.querySelectorAll(".pulse-dot")));
    }

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      tweens.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
