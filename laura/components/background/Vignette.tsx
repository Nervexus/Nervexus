"use client";

import { usePathname } from "next/navigation";

/** Layer 1: darkens the viewport's edges. Skipped on /laura, where its
 * radial gradient showed up as faint rings behind the particle orb. */
export function Vignette() {
  const pathname = usePathname();
  if (pathname === "/laura") return null;
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
