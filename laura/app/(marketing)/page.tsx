import { ParticleOrb } from "@/components/ParticleOrb";
import { GetAccessButton } from "@/components/GetAccessButton";

// The public front door. Shows what Laura is, never any of the user's
// data -- everything real sits behind the sign-in.

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-[26px] pb-24">
      <div className="laura-stars pointer-events-none fixed inset-0 -z-10 opacity-50" aria-hidden />

      <section className="relative flex min-h-[80vh] flex-col items-center justify-center text-center">
        {/* Giant LAURA wordmark sitting behind the orb */}
        <p
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none scale-y-110 text-[clamp(6rem,22vw,16rem)] font-bold leading-[0.7] tracking-tighter text-neutral-100"
          aria-hidden
        >
          LAURA
        </p>
        <ParticleOrb className="relative z-10 w-[260px] sm:w-[400px]" />
        <GetAccessButton />
      </section>
    </div>
  );
}
