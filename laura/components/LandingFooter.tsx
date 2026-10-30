/** The front page's footer: just the giant faded LAURA wordmark. */
export function LandingFooter() {
  return (
    <footer className="overflow-hidden border-t border-neutral-900 bg-[#050505] pt-24 text-white">
      <div
        className="mb-16 w-full px-4 text-center"
        style={{
          maskImage: "linear-gradient(180deg, transparent, black 0%, black 55%, transparent)",
          WebkitMaskImage: "linear-gradient(180deg, transparent, black 0%, black 55%, transparent)",
        }}
        aria-hidden
      >
        <p className="scale-y-110 select-none text-[22vw] font-bold leading-[0.7] tracking-tighter text-[#141414]">LAURA</p>
      </div>
    </footer>
  );
}
