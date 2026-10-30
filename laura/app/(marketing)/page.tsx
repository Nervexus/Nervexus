import { ParticleOrb } from "@/components/ParticleOrb";
import { GetAccessButton } from "@/components/GetAccessButton";

// The public front door. Shows what Laura is, never any of the user's
// data -- everything real sits behind the sign-in.

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-[26px] pb-24">
      <div className="laura-stars pointer-events-none fixed inset-0 -z-10 opacity-50" aria-hidden />

      <section className="flex flex-col items-center text-center">
        <ParticleOrb className="w-[300px] sm:w-[440px]" />
        <p className="pill -mt-6"><span className="dot is-live" />Personal assistant</p>
        <h1 className="sr-only">Laura</h1>
        <p className="mt-5 max-w-md text-balance text-[15px] text-muted">
          Reminders, bookings, your rota and a private vault. One assistant you can talk to on the
          site or text on Telegram.
        </p>
        <GetAccessButton />
      </section>

    </div>
  );
}
