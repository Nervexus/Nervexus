"use client";

import { useEffect, useRef } from "react";

type Orb = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  hue: number;
  baseAlpha: number;
};

/**
 * A slow-drifting field of soft amber bokeh orbs behind the hero -- an
 * original canvas-based stand-in for a WebGL/shader background, since we
 * don't have the source shader, built with the same lightweight
 * canvas-loop approach already used for DustRing/DuneBackground rather
 * than pulling in a 3D library for one effect.
 */
export function AmbientField({ hovering = false }: { hovering?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<Orb[]>([]);
  const hoveringRef = useRef(hovering);

  useEffect(() => {
    hoveringRef.current = hovering;
  }, [hovering]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;

    function resize() {
      const parent = canvas!.parentElement;
      width = parent?.clientWidth ?? window.innerWidth;
      height = parent?.clientHeight ?? window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(6, Math.round((width * height) / 90000));
      orbsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 60 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        hue: Math.random() < 0.8 ? 38 : 45,
        baseAlpha: 0.05 + Math.random() * 0.07,
      }));
    }

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const speedMul = hoveringRef.current ? 1.8 : 1;
      const alphaMul = hoveringRef.current ? 1.5 : 1;

      ctx!.clearRect(0, 0, width, height);

      for (const o of orbsRef.current) {
        o.x += o.vx * speedMul * dt * 10;
        o.y += o.vy * speedMul * dt * 10;

        if (o.x < -o.r) o.x = width + o.r;
        if (o.x > width + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = height + o.r;
        if (o.y > height + o.r) o.y = -o.r;

        const grad = ctx!.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0, `hsla(${o.hue}, 90%, 55%, ${o.baseAlpha * alphaMul})`);
        grad.addColorStop(1, "transparent");
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
