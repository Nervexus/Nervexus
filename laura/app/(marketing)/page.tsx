import Link from "next/link";
import { ParticleOrb } from "@/components/ParticleOrb";

// The public front door. Shows what Laura is, never any of the user's
// data -- everything real sits behind the sign-in.

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <div className="laura-stars pointer-events-none fixed inset-0 -z-10 opacity-50" aria-hidden />

      <section className="flex flex-col items-center text-center">
        <ParticleOrb className="w-[300px] sm:w-[440px]" />
        <p className="-mt-6 font-mono text-[10px] uppercase tracking-[0.45em] text-neutral-500">Personal assistant</p>
        <h1 className="sr-only">Laura</h1>
        <p className="mt-6 max-w-md text-balance text-base font-light text-neutral-400">
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

    </div>
  );
}
