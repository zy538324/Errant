import { FilterToolbar } from "@/components/site/filter-toolbar";
import type { ShopArtworkFilters, ShopFilterOptions } from "@/modules/catalogue";

function buildShopHref(
  active: ShopArtworkFilters,
  key: keyof ShopArtworkFilters,
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
  return query ? `/shop?${query}` : "/shop";
}

export function ShopFilters({
  options,
  active,
}: {
  options: ShopFilterOptions;
  active: ShopArtworkFilters;
}) {
  return (
    <FilterToolbar
      sections={[
        {
          label: "Collection Groups",
          options: [
            {
              label: "All groups",
              href: buildShopHref(active, "group", null),
              active: !active.group,
            },
            ...options.groups.map((group) => ({
              label: group.label,
              href: buildShopHref(active, "group", group.slug),
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
              href: buildShopHref(active, "collection", null),
              active: !active.collection,
            },
            ...options.collections.map((collection) => ({
              label: collection.label,
              href: buildShopHref(active, "collection", collection.slug),
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
              href: buildShopHref(active, "category", null),
              active: !active.category,
            },
            ...options.categories.map((category) => ({
              label: category.label,
              href: buildShopHref(active, "category", category.slug),
              active: active.category === category.slug,
              count: category.count,
            })),
          ],
        },
      ]}
    />
  );
}
