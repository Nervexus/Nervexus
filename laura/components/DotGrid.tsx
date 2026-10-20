/** Dark dot-grid canvas background, like a workflow editor's node canvas. */
export function DotGrid() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 35%, black 40%, transparent 85%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 70% at 50% 35%, black 40%, transparent 85%)",
      }}
      aria-hidden="true"
    />
  );
}
