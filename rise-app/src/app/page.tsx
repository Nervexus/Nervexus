import { Greeting } from "@/components/Greeting";
import { MotivationalSpeech } from "@/components/MotivationalSpeech";

// Rendered per-request rather than statically cached: the date label
// and the greeting's time-of-day/harsh-line roll both need to reflect
// "right now", not whatever moment this page last got prerendered.
export const dynamic = "force-dynamic";

export default function HomePage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-[65vh] flex-col justify-center">
      <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.16em] text-muted-page">
        {today}
      </p>
      <Greeting />
      <div className="mt-6">
        <MotivationalSpeech />
      </div>
    </div>
  );
}
