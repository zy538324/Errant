import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import type { PortfolioItem } from "@/modules/portfolio";

export function PortfolioGrid({
  items,
  emptyMessage,
}: {
  items: PortfolioItem[];
  emptyMessage?: string;
}) {
  const resolvedEmptyMessage = emptyMessage?.trim() ?? "";

  if (items.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-stone-300">
        {resolvedEmptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {items.map((item) => (
        <PortfolioCard key={item.id} item={item} />
      ))}
    </div>
  );
}
