const TELEGRAM_URL = "https://t.me/Laura1xbot";

/** A soft recessed dish (dark take on a neumorphic fingerprint button) that
 * opens the Telegram chat with Laura's bot. The dot underneath glows in the
 * orb's blue and brightens on hover. */
export function TelegramButton() {
  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Laura on Telegram"
      className="group flex flex-col items-center gap-4 outline-none"
    >
      <span className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#1d1d22,#0b0b0d_70%)] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] transition-transform duration-300 group-hover:scale-[1.03] group-focus-visible:ring-2 group-focus-visible:ring-sky-400/60">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[radial-gradient(circle_at_60%_70%,#18181c,#0a0a0c)] shadow-[inset_6px_8px_14px_rgba(0,0,0,0.85),inset_-4px_-5px_12px_rgba(255,255,255,0.05)]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="h-9 w-9 -translate-x-0.5 text-neutral-500 drop-shadow-[0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-300 group-hover:text-sky-300"
          >
            <path d="M21 4 3 11.2l6.3 2.3L19 6.6l-7.6 8.6 6.1 4.6L21 4Z" />
            <path d="m9.3 13.5.9 5.8 2.6-3.6" />
          </svg>
        </span>
      </span>
      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_3px_rgba(56,189,248,0.45)] transition-shadow duration-300 group-hover:shadow-[0_0_16px_5px_rgba(56,189,248,0.7)]" />
      <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 transition-colors group-hover:text-neutral-300">
        Chat on Telegram
      </span>
    </a>
  );
}
