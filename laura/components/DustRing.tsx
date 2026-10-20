"use client";

import { useEffect, useRef } from "react";
import type { OrbStatus } from "@/components/VoiceOrb";

const STATUS_COLOR: Record<OrbStatus, [number, number, number]> = {
  idle: [212, 212, 216], // neutral-300 -- a quiet, mostly-still dust ring
  listening: [251, 191, 36], // amber-400
  thinking: [167, 139, 250], // violet-400
  speaking: [252, 211, 77], // amber-300
  unsupported: [82, 82, 82], // neutral-600
};

type Particle = {
  angle: number;
  radius: number; // normalized 0..1, biased toward the outer edge
  size: number;
  phase: number;
  twinkleSpeed: number;
};

/** A ring of drifting, twinkling dust around the voice orb's button. */
export function DustRing({ status, size = 224 }: { status: OrbStatus; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    particlesRef.current = Array.from({ length: 200 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.62 + Math.random() * 0.38,
      size: Math.random() * 1.5 + 0.4,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.2 + Math.random() * 0.5,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let rotation = 0;
    let last = performance.now();
    const start = last;

    function frame(now: number) {
      const t = (now - start) / 1000;
      const dt = (now - last) / 1000;
      last = now;
      const status = statusRef.current;
      const [r, g, b] = STATUS_COLOR[status];

      const spinSpeed = status === "thinking" ? 0.9 : status === "unsupported" ? 0 : 0.04;
      rotation += spinSpeed * dt;

      const pulse =
        status === "listening"
          ? 1 + Math.sin(t * 4) * 0.05
          : status === "speaking"
            ? 1 + Math.sin(t * 10) * 0.04
            : 1;

      ctx!.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const outerR = size / 2;

      for (const p of particlesRef.current) {
        const a = p.angle + rotation;
        const rad = p.radius * outerR * pulse;
        const x = cx + Math.cos(a) * rad;
        const y = cy + Math.sin(a) * rad;
        const twinkle =
          status === "unsupported"
            ? 0.3
            : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * p.twinkleSpeed * 3 + p.phase));
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${twinkle})`;
        ctx!.arc(x, y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
}
