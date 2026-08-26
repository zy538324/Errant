import { CollectionGrid } from "@/components/site/collection-grid";
import { ShopFilters } from "@/components/shop/filters";
import {
  getShopFilterOptions,
  listPublishedArtworks,
  type ShopArtworkFilters,
} from "@/modules/catalogue";
import { getPublicPageContent, metadataString } from "@/lib/public-page-content";

export const dynamic = "force-dynamic";

const shopFallback = {
  eyebrow: "Digital gallery",
  title: "Shop",
  intro: "Browse licensed digital downloads from the Errant Arts collection.",
  body: "Online purchases are currently for licensed digital downloads only.",
  metadata: {
    gridEyebrow: "",
    gridTitle: "",
    gridDescription: "",
    emptyMessage: "",
  },
};

function takeQueryValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const activeFilters: ShopArtworkFilters = {
    group: takeQueryValue(resolvedSearchParams.group) ?? null,
    collection: takeQueryValue(resolvedSearchParams.collection) ?? null,
    category: takeQueryValue(resolvedSearchParams.category) ?? null,
  };
  const [works, filterOptions, pageContent] = await Promise.all([
    listPublishedArtworks(activeFilters),
    getShopFilterOptions(),
    getPublicPageContent("shop", shopFallback),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      {pageContent.eyebrow ? (
        <div className="text-xs uppercase tracking-[0.3em] text-stone-400">
          {pageContent.eyebrow}
        </div>
      ) : null}
      <h1 className="mt-3 font-serif text-5xl text-stone-50">{pageContent.title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-300">
        {pageContent.intro ?? shopFallback.intro}
      </p>
      {pageContent.body ? (
        <p className="mt-4 max-w-2xl rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-300">
          {pageContent.body}
        </p>
      ) : null}
      <div className="mt-8">
        <ShopFilters options={filterOptions} active={activeFilters} />
      </div>
      <CollectionGrid
        works={works}
        eyebrow={metadataString(pageContent, "gridEyebrow", "")}
        title={metadataString(pageContent, "gridTitle", "")}
        description={metadataString(pageContent, "gridDescription", "")}
        emptyMessage={metadataString(pageContent, "emptyMessage", "")}
        ctaHref={null}
      />
    </main>
  );
}
