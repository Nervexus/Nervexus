import { CATEGORIES } from "@/lib/categories";
import { CategoryCard } from "@/components/CategoryCard";
import { TodayOverview } from "@/components/TodayOverview";
import { ChecklistsSummary, GoalsSummary } from "@/components/SummaryCards";

export default function HomePage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <header className="animate-fade-up mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {today}
        </p>
        <h1 className="mt-1 text-[32px] font-semibold tracking-tight">
          Rise
        </h1>
        <p className="mt-1 text-sm text-muted">
          Maximum results, every single day.
        </p>
      </header>

      <div className="mb-6">
        <TodayOverview />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-muted">
        Categories
      </h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {CATEGORIES.map((category) => (
          <CategoryCard key={category.key} category={category} />
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-muted">
        Quick Tools
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <ChecklistsSummary />
        <GoalsSummary />
      </div>
    </div>
  );
}
