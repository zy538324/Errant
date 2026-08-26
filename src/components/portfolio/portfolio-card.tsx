import { Card, CardContent } from "@/components/ui/card";
import { ProtectedPreview } from "@/components/site/protected-preview";
import type { PortfolioItem } from "@/modules/portfolio";

export function PortfolioCard({ item }: { item: PortfolioItem }) {
  return (
    <Card className="overflow-hidden bg-[#131516]">
      <ProtectedPreview
        alt={item.previewAlt ?? item.title}
        src={item.imageUrl ?? item.previewUrl ?? "/logo.png"}
      />
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.24em] text-stone-400">
          {item.category ? <span>{item.category}</span> : null}
          {item.collection?.name ? <span>{item.collection.name}</span> : null}
        </div>
        <div>
          <h2 className="font-serif text-2xl text-stone-50">{item.title}</h2>
          {item.description ? (
            <p className="mt-3 text-sm leading-7 text-stone-300">
              {item.description}
            </p>
          ) : null}
        </div>
        {item.groups.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {item.groups.map((group) => (
              <span
                key={`${item.id}:${group.slug}`}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-300"
              >
                {group.title}
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
