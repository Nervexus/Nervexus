import Link from "next/link";

const COLUMNS = [
  [
    { label: "Laura", href: "/laura" },
    { label: "Notes", href: "/notes" },
    { label: "Reminders", href: "/reminders" },
  ],
  [
    { label: "Rota", href: "/rota" },
    { label: "Bookings", href: "/bookings" },
    { label: "Vault", href: "/vault" },
    { label: "Telegram", href: "https://t.me/Laura1xbot", external: true },
  ],
];

/** The front page's footer: a giant faded wordmark, links into the app
 * (all behind the sign-in), and a line-drawn set of Laura's things -- a
 * phone that fills with purple and ripples on hover, a chat bubble, a
 * calendar, and a lock. */
export function LandingFooter() {
  return (
    <footer className="overflow-hidden border-t border-neutral-900 bg-[#050505] pt-24 text-white">
      <div
        className="mb-20 w-full px-4 text-center"
        style={{
          maskImage: "linear-gradient(180deg, transparent, black 0%, black 55%, transparent)",
          WebkitMaskImage: "linear-gradient(180deg, transparent, black 0%, black 55%, transparent)",
        }}
        aria-hidden
      >
        <p className="scale-y-110 select-none text-[22vw] font-bold leading-[0.7] tracking-tighter text-[#141414]">LAURA</p>
      </div>

      <div className="grid grid-cols-1 border-t border-neutral-900 lg:grid-cols-2">
        <nav className="grid grid-cols-2 gap-12 border-neutral-900 p-8 md:p-16 lg:border-r" aria-label="Footer">
          {COLUMNS.map((col, i) => (
            <div key={i} className="flex flex-col gap-6">
              {col.map((l) =>
                "external" in l ? (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label text-xs transition-colors hover:text-white"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="label text-xs transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                )
              )}
            </div>
          ))}
        </nav>

        <div className="laura-wire relative flex h-48 w-full items-center justify-center overflow-hidden border-t border-neutral-900 lg:h-auto lg:border-t-0">
          <svg viewBox="0 0 400 120" className="h-40 w-full max-w-[640px] opacity-25" preserveAspectRatio="xMidYMid meet" aria-hidden>
            {/* Chat bubble */}
            <path d="M30 30 H110 Q118 30 118 38 V74 Q118 82 110 82 H60 L44 96 V82 H38 Q30 82 30 74 V38 Q30 30 38 30 Z" stroke="white" strokeWidth="1" fill="none" />
            <path d="M48 48 H100 M48 62 H86" stroke="white" strokeWidth="1" />

            {/* Phone with liquid */}
            <g transform="translate(150, 8)">
              <defs>
                <clipPath id="laura-phone-clip">
                  <rect x="4" y="12" width="52" height="82" rx="3" />
                </clipPath>
              </defs>
              <rect x="0" y="0" width="60" height="106" rx="9" stroke="white" strokeWidth="1" fill="none" />
              <rect x="4" y="12" width="52" height="82" rx="3" stroke="white" strokeWidth="1" fill="none" />
              <path d="M24 6 H36" stroke="white" strokeWidth="1" />
              <circle cx="30" cy="100" r="2.5" stroke="white" strokeWidth="1" fill="none" />
              <g clipPath="url(#laura-phone-clip)">
                <rect className="liquid-fill" x="4" y="62" width="52" height="32" fill="#7c3aed" opacity="0.55" />
                <path className="liquid-wave" d="M4 62 Q17 56 30 59 Q43 62 56 57 L56 94 L4 94 Z" fill="#8b5cf6" opacity="0.85" />
              </g>
            </g>

            {/* Calendar */}
            <g transform="translate(240, 22)">
              <rect x="0" y="8" width="70" height="66" rx="4" stroke="white" strokeWidth="1" fill="none" />
              <path d="M0 24 H70 M16 0 V14 M54 0 V14" stroke="white" strokeWidth="1" />
              <path d="M14 38 H22 M31 38 H39 M48 38 H56 M14 54 H22 M31 54 H39" stroke="white" strokeWidth="1" />
            </g>

            {/* Lock */}
            <g transform="translate(332, 30)">
              <path d="M10 26 V16 Q10 2 25 2 Q40 2 40 16 V26" stroke="white" strokeWidth="1" fill="none" />
              <rect x="2" y="26" width="46" height="40" rx="4" stroke="white" strokeWidth="1" fill="none" />
              <path d="M25 40 V52" stroke="white" strokeWidth="1" />
            </g>
          </svg>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t border-neutral-900 px-8 py-8 text-[10px] font-medium tracking-wide text-neutral-600 md:flex-row md:px-16 lg:col-span-2">
          <p>2026 Laura · Madoxs Harvey&apos;s personal assistant</p>
          <div className="flex gap-8">
            <Link href="/laura" className="transition-colors hover:text-white">
              Sign in
            </Link>
            <a href="https://t.me/Laura1xbot" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
              Telegram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
