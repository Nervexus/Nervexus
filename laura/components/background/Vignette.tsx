"use client";

import { usePathname } from "next/navigation";

export function Vignette() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/laura" || pathname === "/login") return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{
        background: "radial-gradient(circle at 50% 0%, rgba(139,111,212,0.03) 0%, transparent 70%)",
      }}
      aria-hidden="true"
    />
  );
}
