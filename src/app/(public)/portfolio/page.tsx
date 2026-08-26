import { PortfolioFilters } from "@/components/portfolio/filters";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import {
  getPortfolioFilterOptions,
  listPortfolioItems,
  type PortfolioFilters as PortfolioFilterState,
} from "@/modules/portfolio";
import { getPublicPageContent, metadataString } from "@/lib/public-page-content";

export const dynamic = "force-dynamic";

const portfolioFallback = {
  eyebrow: "Portfolio",
  title: "Fine Art & Sports Photography",
  intro: "Explore selected images by collection, subject, and event. When a piece is available to buy, it is sold as a licensed digital download.",
  metadata: {
    emptyMessage: "New portfolio work will appear here soon.",
  },
};

function takeQueryValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const activeFilters: PortfolioFilterState = {
    group: takeQueryValue(resolvedSearchParams.group) ?? null,
    collection: takeQueryValue(resolvedSearchParams.collection) ?? null,
    category: takeQueryValue(resolvedSearchParams.category) ?? null,
  };
  const [items, filterOptions, pageContent] = await Promise.all([
    listPortfolioItems(activeFilters),
    getPortfolioFilterOptions(),
    getPublicPageContent("portfolio", portfolioFallback),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <div className="text-xs uppercase tracking-[0.3em] text-stone-400">
        {pageContent.eyebrow ?? portfolioFallback.eyebrow}
      </div>
      <h1 className="mt-3 max-w-4xl font-serif text-5xl text-stone-50">
        {pageContent.title}
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
        {pageContent.intro ?? portfolioFallback.intro}
      </p>
      <div className="mt-8">
        <PortfolioFilters options={filterOptions} active={activeFilters} />
      </div>
      <section className="mt-10">
        <PortfolioGrid
          items={items}
          emptyMessage={metadataString(pageContent, "emptyMessage", "New portfolio work will appear here soon.")}
        />
      </section>
    </main>
  );
}
