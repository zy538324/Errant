import { listOwnerPortfolioItems, type OwnerPortfolioItem } from "@/lib/app-content";
import { normalizeCollectionSlug } from "@/lib/storage";
import {
  listPublishedPortfolioItems,
  type SanityCollectionGroupRef,
  type SanityPortfolioItem,
} from "@/sanity/lib/loaders";

export type PortfolioGroupRef = {
  title: string;
  slug: string;
};

export type PortfolioItem = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  description: string | null;
  collection: { name: string; slug: string } | null;
  groups: PortfolioGroupRef[];
  previewAlt: string | null;
  previewUrl: string | null;
  imageUrl: string | null;
  updatedAt: string | null;
};

type PortfolioFilterOption = {
  label: string;
  slug: string;
  count: number;
};

export type PortfolioFilters = {
  group?: string | null;
  collection?: string | null;
  category?: string | null;
};

export type PortfolioFilterOptions = {
  groups: PortfolioFilterOption[];
  collections: PortfolioFilterOption[];
  categories: PortfolioFilterOption[];
};

function humanizeCollectionSlug(collectionSlug: string | null | undefined) {
  const label = (collectionSlug ?? "").trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  if (!label) return "";
  return label.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function toOwnerCollection(item: OwnerPortfolioItem) {
  const slug = normalizeCollectionSlug(item.collectionSlug ?? item.collectionName ?? "");
  if (!slug) return null;
  return { name: item.collectionName?.trim() || humanizeCollectionSlug(item.collectionSlug), slug };
}

function slugifyFilterLabel(value: string | null | undefined) {
  return normalizeCollectionSlug(value ?? "");
}

function parseGroups(groupsJson: string | null | undefined): PortfolioGroupRef[] {
  try {
    const parsed = JSON.parse(groupsJson || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "string") {
          const title = item.trim();
          const slug = normalizeCollectionSlug(title);
          return title && slug ? { title, slug } : null;
        }
        if (item && typeof item === "object") {
          const record = item as { title?: unknown; slug?: unknown; name?: unknown };
          const title = String(record.title ?? record.name ?? "").trim();
          const slug = normalizeCollectionSlug(String(record.slug ?? title));
          return title && slug ? { title, slug } : null;
        }
        return null;
      })
      .filter((item): item is PortfolioGroupRef => Boolean(item));
  } catch {
    return [];
  }
}

function toOwnerPortfolioItem(item: OwnerPortfolioItem): PortfolioItem {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title || "Untitled Portfolio Item",
    category: item.category,
    description: item.description,
    collection: toOwnerCollection(item),
    groups: parseGroups(item.groupsJson),
    previewAlt: item.imageAlt,
    previewUrl: item.previewUrl,
    imageUrl: item.previewUrl,
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
  };
}

function applyPortfolioFilters(items: PortfolioItem[], filters: PortfolioFilters = {}) {
  const groupFilter = slugifyFilterLabel(filters.group);
  const collectionFilter = slugifyFilterLabel(filters.collection);
  const categoryFilter = slugifyFilterLabel(filters.category);
  return items.filter((item) => {
    const matchesGroup = groupFilter ? item.groups.some((group) => group.slug === groupFilter) : true;
    const matchesCollection = collectionFilter ? item.collection?.slug === collectionFilter : true;
    const matchesCategory = categoryFilter ? slugifyFilterLabel(item.category) === categoryFilter : true;
    return matchesGroup && matchesCollection && matchesCategory;
  });
}

function toFilterOptions(records: Array<{ label: string; slug: string }>) {
  const grouped = new Map<string, PortfolioFilterOption>();
  for (const record of records) {
    const slug = record.slug.trim();
    const label = record.label.trim();
    if (!slug || !label) continue;
    const existing = grouped.get(slug);
    if (existing) { existing.count += 1; continue; }
    grouped.set(slug, { label, slug, count: 1 });
  }
  return Array.from(grouped.values()).sort((left, right) => left.label.localeCompare(right.label));
}

function sortPortfolioItems(items: PortfolioItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt ?? "") || 0;
    const rightTime = Date.parse(right.updatedAt ?? "") || 0;
    return rightTime - leftTime || left.title.localeCompare(right.title);
  });
}

function toLegacyCollection(collectionSlug: string | null | undefined) {
  const slug = normalizeCollectionSlug(collectionSlug ?? "");
  if (!slug) return null;
  return { name: humanizeCollectionSlug(collectionSlug), slug };
}

function toLegacyPortfolioItem(item: SanityPortfolioItem): PortfolioItem {
  const previewUrl = item.protectedPreviewUrl;

  return {
    id: item.id,
    slug: item.slug,
    title: item.title ?? "Untitled Portfolio Item",
    category: item.category,
    description: item.description,
    collection: toLegacyCollection(item.collectionSlug),
    groups: item.groups.map((group: SanityCollectionGroupRef) => ({ title: group.title, slug: group.slug })),
    previewAlt: item.previewAlt,
    previewUrl,
    imageUrl: previewUrl,
    updatedAt: item.updatedAt,
  };
}

async function loadPortfolioItems() {
  const [ownerItems, legacyItems] = await Promise.all([
    listOwnerPortfolioItems().catch(() => [] as OwnerPortfolioItem[]),
    listPublishedPortfolioItems().catch(() => [] as SanityPortfolioItem[]),
  ]);

  const ownerBySlug = new Map(ownerItems.map((item) => [item.slug, item] as const));
  const merged = new Map<string, PortfolioItem>();

  for (const item of legacyItems.map(toLegacyPortfolioItem)) {
    if (ownerBySlug.has(item.slug)) continue;
    merged.set(item.slug, item);
  }

  for (const ownerItem of ownerItems) {
    if (ownerItem.status !== "PUBLISHED") continue;
    merged.set(ownerItem.slug, toOwnerPortfolioItem(ownerItem));
  }

  return sortPortfolioItems(Array.from(merged.values()));
}

export async function listPortfolioItems(filters: PortfolioFilters = {}) {
  const items = await loadPortfolioItems();
  return applyPortfolioFilters(items, filters);
}

export async function getPortfolioFilterOptions(): Promise<PortfolioFilterOptions> {
  const items = await loadPortfolioItems();
  return {
    groups: toFilterOptions(items.flatMap((item) => item.groups.map((group) => ({ label: group.title, slug: group.slug })))),
    collections: toFilterOptions(items.map((item) => item.collection ? { label: item.collection.name, slug: item.collection.slug } : null).filter((value): value is { label: string; slug: string } => Boolean(value))),
    categories: toFilterOptions(items.map((item) => item.category ? { label: item.category, slug: slugifyFilterLabel(item.category) } : null).filter((value): value is { label: string; slug: string } => Boolean(value))),
  };
}
