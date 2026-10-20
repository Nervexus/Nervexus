"use client";

import { useEffect, useRef } from "react";

type Speck = {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  hue: number;
};

/** Ambient warm speckled horizon, sitting behind the home page's hero section. */
export function DuneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let specks: Speck[] = [];
    let width = 0;
    let height = 0;

    function resize() {
      const parent = canvas!.parentElement;
      width = parent?.clientWidth ?? window.innerWidth;
      height = parent?.clientHeight ?? 420;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((width * height) / 3500);
      specks = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        // bias toward the bottom, like sand catching distant light
        y: height - Math.pow(Math.random(), 1.8) * height,
        r: Math.random() * 1.3 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.8,
        hue: Math.random() < 0.7 ? 30 : 8,
      }));
    }

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const start = performance.now();

    function frame(now: number) {
      const t = (now - start) / 1000;
      ctx!.clearRect(0, 0, width, height);

      const horizonY = height * 0.6;
      const glow = ctx!.createLinearGradient(0, horizonY - 60, 0, height);
      glow.addColorStop(0, "rgba(120, 60, 20, 0)");
      glow.addColorStop(1, "rgba(120, 60, 20, 0.14)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, horizonY - 60, width, height - (horizonY - 60));

      for (const s of specks) {
        const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx!.beginPath();
        ctx!.fillStyle = `hsla(${s.hue}, 80%, 60%, ${twinkle * 0.8})`;
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
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

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
