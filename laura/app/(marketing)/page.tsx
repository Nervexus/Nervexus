import Link from "next/link";
import { ParticleOrb } from "@/components/ParticleOrb";

// The public front door. Shows what Laura does, never any of the user's
// data -- everything real sits behind the sign-in.
const FEATURES = [
  { label: "Telegram", title: "Text her anywhere", body: "Chat, voice notes, and rota photos straight from Telegram." },
  { label: "Bookings", title: "Somewhere to go", body: "Asks what it's for, shows the place, sends a ready-to-book link." },
  { label: "Reminders", title: "Never miss a thing", body: "A month at a glance, set by you or by Laura mid-conversation." },
  { label: "Rota", title: "Your shifts, sorted", body: "Photograph the rota; she knows when you're working and with who." },
  { label: "Vault", title: "Locked away", body: "Encrypted at rest. Laura herself can't read it." },
  { label: "Notes", title: "Remember everything", body: "Folders you can PIN-lock, filled by you or by her." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-16">
      <div className="laura-stars pointer-events-none fixed inset-0 -z-10 opacity-50" aria-hidden />

      <section className="flex flex-col items-center text-center">
        <ParticleOrb className="w-[300px] sm:w-[440px]" />
        <p className="-mt-6 font-mono text-[10px] uppercase tracking-[0.45em] text-neutral-500">Personal assistant</p>
        <h1 className="mt-4 text-balance text-5xl font-thin tracking-tight text-neutral-50 sm:text-7xl">Laura</h1>
        <p className="mt-5 max-w-md text-balance text-base font-light text-neutral-400">
          Reminders, bookings, your rota and a private vault. One assistant you can talk to on the
          site or text on Telegram.
        </p>
        <Link
          href="/laura"
          className="group mt-10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-300 transition-colors hover:text-neutral-50"
        >
          Get access
          <span className="relative h-px w-16 bg-neutral-500 transition-all group-hover:w-24 group-hover:bg-violet-400">
            <span className="absolute -top-[3px] right-0 h-[7px] w-[7px] rotate-45 border-r border-t border-neutral-500 group-hover:border-violet-400" />
          </span>
        </Link>
      </section>

      <div className="mt-20 h-px w-full bg-gradient-to-r from-transparent via-[var(--calendar-accent)]/60 to-transparent" />

      <section className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.label}
            className="rounded-3xl bg-gradient-to-b from-[#19191b] to-[#121213] p-6 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.9)]"
          >
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
              <span className="h-1 w-1 rounded-full bg-violet-400" />
              {f.label}
            </p>
            <h2 className="mt-5 text-xl font-thin text-neutral-100">{f.title}</h2>
            <p className="mt-2 text-sm font-light leading-relaxed text-neutral-500">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
