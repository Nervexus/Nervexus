const TELEGRAM_URL = "https://t.me/Laura1xbot";

/** A quiet pill that opens the Telegram chat with Laura's bot. */
export function TelegramButton() {
  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Laura on Telegram"
      className="btn-ghost text-xs"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" className="h-4 w-4" aria-hidden>
        <path d="M21 4 3 11.2l6.3 2.3L19 6.6l-7.6 8.6 6.1 4.6L21 4Z" />
        <path d="m9.3 13.5.9 5.8 2.6-3.6" />
      </svg>
      Chat on Telegram
    </a>
  );
}
