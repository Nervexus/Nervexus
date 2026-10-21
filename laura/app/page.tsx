import Link from "next/link";
import { DotWaveField } from "@/components/DotWaveField";
import { Pill } from "@/components/Pill";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-neutral-950">
      <DotWaveField />

      <div className="relative mt-auto px-6 pb-16 pt-24 text-center">
        <Pill className="mb-6">Personal Assistant</Pill>

        <h1 className="font-serif text-5xl text-neutral-50 sm:text-6xl md:text-7xl">
          Remember
          <br />
          <span className="italic font-light text-amber-300">everything.</span>
        </h1>

        <p className="mx-auto mt-8 max-w-[440px] text-balance font-mono text-sm text-neutral-500 sm:text-base">
          A voice that&apos;s always ready to listen — notes, reminders, and a vault that never
          forgets.
        </p>

        <Link
          href="/laura"
          className="mt-14 inline-block bg-gradient-to-br from-amber-300 to-amber-500 px-7 py-3.5 font-mono text-sm font-medium tracking-wide text-neutral-950 transition-opacity hover:opacity-90"
          style={{
            clipPath:
              "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
          }}
        >
          [Talk to Laura]
        </Link>
      </div>
    </div>
  );
}
