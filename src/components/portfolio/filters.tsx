import { FilterToolbar } from "@/components/site/filter-toolbar";
import type {
  PortfolioFilters as PortfolioFilterState,
  PortfolioFilterOptions,
} from "@/modules/portfolio";

function buildPortfolioHref(
  active: PortfolioFilterState,
  key: keyof PortfolioFilterState,
  value?: string | null,
) {
  const params = new URLSearchParams();

  for (const [entryKey, entryValue] of Object.entries(active)) {
    if (entryValue && entryKey !== key) {
      params.set(entryKey, entryValue);
    }
  }

  if (value) {
    params.set(key, value);
  }

  const query = params.toString();
  return query ? `/portfolio?${query}` : "/portfolio";
}

export function PortfolioFilters({
  options,
  active,
}: {
  options: PortfolioFilterOptions;
  active: PortfolioFilterState;
}) {
  return (
    <FilterToolbar
      sections={[
        {
          label: "Collection Groups",
          options: [
            {
              label: "All groups",
              href: buildPortfolioHref(active, "group", null),
              active: !active.group,
            },
            ...options.groups.map((group) => ({
              label: group.label,
              href: buildPortfolioHref(active, "group", group.slug),
              active: active.group === group.slug,
              count: group.count,
            })),
          ],
        },
        {
          label: "Collections",
          options: [
            {
              label: "All collections",
              href: buildPortfolioHref(active, "collection", null),
              active: !active.collection,
            },
            ...options.collections.map((collection) => ({
              label: collection.label,
              href: buildPortfolioHref(active, "collection", collection.slug),
              active: active.collection === collection.slug,
              count: collection.count,
            })),
          ],
        },
        {
          label: "Categories",
          options: [
            {
              label: "All categories",
              href: buildPortfolioHref(active, "category", null),
              active: !active.category,
            },
            ...options.categories.map((category) => ({
              label: category.label,
              href: buildPortfolioHref(active, "category", category.slug),
              active: active.category === category.slug,
              count: category.count,
            })),
          ],
        },
      ]}
    />
  );
}
