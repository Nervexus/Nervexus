// Thin line icons for the nav rail (stroke 1.8, currentColor, no fill).
const PATHS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  laura: "M12 4v16M8 8v8M16 8v8M4 11v2M20 11v2",
  routine: "M10 6h10M10 12h10M10 18h10M4 6l1.2 1.2L7.5 5M4 12l1.2 1.2L7.5 11M4 18l1.2 1.2L7.5 17",
  notes: "M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v4h4M8 12h8M8 16h5",
  reminders: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  rota: "M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M9 3v4M15 3v4",
  bookings: "M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z",
  content: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 16l5-5 4 4 2.5-2.5L20 17M15 9h.01",
  vault: "M7 11h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11",
  calls:
    "M21 16.4v2.8a1.9 1.9 0 0 1-2 1.9A17.6 17.6 0 0 1 3 5a1.9 1.9 0 0 1 1.9-2h2.8a1.9 1.9 0 0 1 1.9 1.6l.4 2.2a1.9 1.9 0 0 1-.5 1.7L8.3 9.7a14 14 0 0 0 6 6l1.2-1.2a1.9 1.9 0 0 1 1.7-.5l2.2.4a1.9 1.9 0 0 1 1.6 2z",
  settings: "M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1M15 5v4M9 10v4M17 15v4",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  hub: "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8",
  refresh: "M20 11a8 8 0 1 0-.9 4.3M20 5v6h-6",
  close: "M6 6l12 12M18 6 6 18",
};

export function NavIcon({ name, className = "h-[18px] w-[18px]" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={PATHS[name] ?? PATHS.more} />
    </svg>
  );
}

export function LogoMark({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  const L = "M8.6 5.4h2.9v10.1h6v2.9H8.6z";
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d={L} transform="translate(-0.3,-0.4)" fill="rgba(0,0,0,0.08)" />
      <path d={L} transform="translate(0.3,0.4)" fill="rgba(255,255,255,0.6)" />
      <path d={L} fill="#6a50bf" />
    </svg>
  );
}
