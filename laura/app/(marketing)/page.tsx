import { ParticleOrb } from "@/components/ParticleOrb";
import { GetAccessButton } from "@/components/GetAccessButton";

// The public front door. Shows what Laura is, never any of the user's
// data -- everything real sits behind the sign-in.

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-[26px] pb-24">
      <div className="laura-stars pointer-events-none fixed inset-0 -z-10 opacity-50" aria-hidden />

      <section className="flex min-h-[80vh] flex-col items-center justify-center text-center">
        <ParticleOrb className="w-[260px] sm:w-[400px]" />
        <h1 className="-mt-2 select-none scale-y-110 text-[clamp(3rem,15vw,8rem)] font-bold leading-[0.8] tracking-tighter text-text">
          LAURA
        </h1>
        <GetAccessButton />
      </section>
    </div>
  );
}
