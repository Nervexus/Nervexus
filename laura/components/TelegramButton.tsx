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
      <span className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1),0_12px_32px_-8px_rgba(0,0,0,0.08)] transition-transform duration-300 group-hover:scale-[1.03] group-focus-visible:ring-2 group-focus-visible:ring-violet-500/60">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-2 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06),inset_-2px_-2px_6px_rgba(255,255,255,0.8)]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="h-9 w-9 -translate-x-0.5 text-neutral-400 transition-colors duration-300 group-hover:text-violet-500"
          >
            <path d="M21 4 3 11.2l6.3 2.3L19 6.6l-7.6 8.6 6.1 4.6L21 4Z" />
            <path d="m9.3 13.5.9 5.8 2.6-3.6" />
          </svg>
        </span>
      </span>
      <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_10px_3px_rgba(139,111,212,0.25)] transition-shadow duration-300 group-hover:shadow-[0_0_16px_5px_rgba(139,111,212,0.4)]" />
      <span className="label transition-colors group-hover:text-neutral-600">
        Chat on Telegram
      </span>
    </a>
  );
}
