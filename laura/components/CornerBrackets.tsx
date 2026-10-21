/** Angular targeting-reticle brackets framing a container's four corners. */
export function CornerBrackets({ className = "" }: { className?: string }) {
  const corner = "absolute h-4 w-4 border-amber-500/40";
  return (
    <div className={`pointer-events-none absolute inset-3 ${className}`} aria-hidden="true">
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}
