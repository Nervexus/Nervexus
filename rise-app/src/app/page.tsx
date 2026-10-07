import { CATEGORIES } from "@/lib/categories";
import { CategoryCard } from "@/components/CategoryCard";
import { TodayOverview } from "@/components/TodayOverview";
import { ChecklistsSummary, GoalsSummary } from "@/components/SummaryCards";
import { RankBadge } from "@/components/RankBadge";
import { Greeting } from "@/components/Greeting";

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
    <div>
      <header className="animate-fade-up mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-page">
            {today}
          </p>
          <Greeting />
        </div>
        <RankBadge />
      </header>

      <div className="mb-6">
        <TodayOverview />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-muted-page">
        Categories
      </h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {CATEGORIES.map((category) => (
          <CategoryCard key={category.key} category={category} />
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-muted-page">
        Quick Tools
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <ChecklistsSummary />
        <GoalsSummary />
      </div>
    </div>
  );
}
