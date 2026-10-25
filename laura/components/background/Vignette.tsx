"use client";

import { usePathname } from "next/navigation";

/** Layer 1: darkens the viewport's edges. Skipped on /, /laura and /login, where its
 * radial gradient shows up as faint rings. */
export function Vignette() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/laura" || pathname === "/login") return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{
        background: "radial-gradient(circle, transparent 0%, rgba(8,8,8,0.85) 100%)",
      }}
      aria-hidden="true"
    />
  );
}
