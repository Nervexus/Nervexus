/** Layer 1: darkens the viewport's edges so the ambient mesh reads as a
 * glow at the center rather than a hard-edged canvas rectangle. */
export function Vignette() {
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
