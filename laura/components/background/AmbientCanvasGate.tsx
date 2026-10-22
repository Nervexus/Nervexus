"use client";

import { usePathname } from "next/navigation";
import { AmbientCanvas } from "@/components/background/AmbientCanvas";

/** The WebGL ambient mesh is the "orb" for Laura specifically -- it
 * should only ever be visible on /laura, not as a sitewide background.
 * This stays mounted at the same DOM position (a body-level sibling of
 * the content wrapper) that AmbientCanvas always used, so z-index
 * stacking is unaffected; it just skips rendering (and therefore
 * creating a WebGL context) off that one route. */
export function AmbientCanvasGate() {
  const pathname = usePathname();
  if (pathname !== "/laura") return null;
  return <AmbientCanvas />;
}
