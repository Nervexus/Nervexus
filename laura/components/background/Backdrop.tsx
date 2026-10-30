export function Backdrop() {
  return (
    <div className="dusk-backdrop pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <span className="dusk-glow absolute left-[6%] top-[62%] h-24 w-24" />
      <span className="dusk-glow absolute right-[8%] top-[18%] h-16 w-16 opacity-60" />
      <span className="dusk-glow absolute bottom-[-40px] right-[30%] h-40 w-40 opacity-50" />
    </div>
  );
}
