import { ParticleOrb } from "@/components/ParticleOrb";
import { GetAccessButton } from "@/components/GetAccessButton";

// The public front door. Shows what Laura is, never any of the user's
// data -- everything real sits behind the sign-in.

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-[26px] pb-24">
      <div className="laura-stars pointer-events-none fixed inset-0 -z-10 opacity-50" aria-hidden />

      <section className="flex flex-col items-center text-center">
        <ParticleOrb className="w-[300px] sm:w-[440px]" />
        <h1 className="sr-only">Laura</h1>
        <GetAccessButton />
      </section>
    </div>
  );
}
