"use client";

import { useEffect, useRef } from "react";

const COLS = 110;
const ROWS = 160;
const SPACING_X = 22;
const SPACING_Z = 20;

/**
 * A grayscale dot-matrix wave plane receding toward the top of the
 * viewport, like a camera looking down a rippling grid -- a 2D-canvas
 * fake-perspective approximation of a 3D particle wave shader, built
 * with the same plain-canvas approach already used elsewhere in this
 * app (DustRing, DotGrid, DuneBackground) rather than adding Three.js.
 */
export function DotWaveField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    }

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const start = performance.now();
    const perspective = 1400;
    const camTilt = 0.62; // 0..1, how much depth moves a dot up the screen

    function frame(now: number) {
      const t = (now - start) / 1000;
      ctx!.clearRect(0, 0, width, height);

      const originX = width / 2;
      const originY = height * 0.62;

      for (let row = 0; row < ROWS; row++) {
        const worldZ = row * SPACING_Z;
        const scale = perspective / (perspective + worldZ);
        if (scale < 0.05) continue;

        for (let col = 0; col < COLS; col++) {
          const worldX = (col - COLS / 2) * SPACING_X;
          const wave =
            Math.sin(worldX * 0.012 + worldZ * 0.01 - t * 1.1) * 14 +
            Math.sin(worldX * 0.03 - t * 0.6) * 6;

          const screenX = originX + worldX * scale;
          const screenY = originY - worldZ * scale * camTilt + wave * scale;

          if (screenX < -10 || screenX > width + 10 || screenY < -10 || screenY > height + 10) {
            continue;
          }

          const twinkle = 0.55 + 0.45 * Math.sin(worldX * 0.05 + worldZ * 0.04 + t * 1.4);
          const alpha = Math.max(0, scale * 0.85 * twinkle);
          const size = Math.max(0.4, scale * 1.8);

          ctx!.beginPath();
          ctx!.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx!.arc(screenX, screenY, size, 0, Math.PI * 2);
          ctx!.fill();
        }
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
