/** Layer 4: a fixed, near-invisible procedural film-grain overlay over
 * everything (including the nav/footer), breaking up flat gradients. */
export function NoiseOverlay() {
  return (
    <div
      className="noise-overlay pointer-events-none fixed inset-0 z-[100] opacity-[0.02]"
      aria-hidden="true"
    />
  );
}
