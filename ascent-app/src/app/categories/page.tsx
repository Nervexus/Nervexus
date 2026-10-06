import { PageHeader } from "@/components/PageHeader";
import { CategoryCard } from "@/components/CategoryCard";
import { CATEGORIES } from "@/lib/categories";

export default function CategoriesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Level up"
        title="Categories"
        subtitle="Every dimension of your best self."
        back
      />
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((category) => (
          <CategoryCard key={category.key} category={category} />
        ))}
      </div>
    </div>
  );
}
