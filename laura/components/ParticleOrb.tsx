"use client";

import { useEffect, useRef } from "react";

const POINTS = 3400;

/** A sphere of dots (Fibonacci-distributed so they're evenly spaced),
 * pushed in and out by a few layered sine waves so the surface folds like
 * cloth, slowly rotating. Shaded sky-blue on top to violet underneath, with
 * nearer dots drawn larger and brighter. `active` swells the folds while
 * Laura is thinking. */
export function ParticleOrb({ active = false, className = "" }: { active?: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const base = Array.from({ length: POINTS }, (_, i) => {
      const y = 1 - (i / (POINTS - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = i * Math.PI * (3 - Math.sqrt(5));
      return [Math.cos(theta) * r, y, Math.sin(theta) * r] as const;
    });

    let size = 0;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    fit();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let amp = 0.2;
    let raf = 0;

    const draw = (ms: number) => {
      const t = reduced ? 0 : ms / 1000;
      amp += ((activeRef.current ? 0.34 : 0.2) - amp) * 0.04;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.36;
      const rotY = t * 0.18;
      const rotX = 0.35 + Math.sin(t * 0.13) * 0.15;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      for (const [bx, by, bz] of base) {
        const d =
          Math.sin(bx * 3.1 + t * 0.9) * Math.cos(by * 2.7 - t * 0.7) +
          0.6 * Math.sin(bz * 4.3 + by * 1.9 + t * 1.1) +
          0.35 * Math.cos(bx * 5.2 - bz * 3.3 - t * 0.5);
        const r = 1 + amp * d;
        let x = bx * r, y = by * r, z = bz * r;
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        x = x1; z = z1;
        const y2 = y * cosX - z * sinX;
        z = y * sinX + z * cosX;
        y = y2;

        const depth = (z + 1.4) / 2.8;
        const persp = 1.6 / (2.6 - z);
        const px = cx + x * R * persp * 1.6;
        const py = cy + y * R * persp * 1.6;

        const mix = Math.min(1, Math.max(0, (y + 0.9) / 1.8));
        const red = Math.round(90 + 110 * mix);
        const green = Math.round(180 - 70 * mix);
        const blue = 255;
        ctx.fillStyle = `rgba(${red},${green},${blue},${0.2 + depth * 0.8})`;
        const s = 0.55 + depth * 1.45;
        ctx.beginPath();
        ctx.arc(px, py, s, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={`aspect-square ${className}`} aria-hidden />;
}
