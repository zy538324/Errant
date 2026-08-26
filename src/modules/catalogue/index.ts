import { db } from "@/lib/db";
import { getPublicObjectUrl, normalizeCollectionSlug } from "@/lib/storage";
import { createPublicHostedImageUrl } from "@/lib/protected-images";
import { createSignedStoragePreviewUrl } from "@/lib/watermark";
import { isRetiredShopArtwork } from "@/lib/shop-availability";

type CollectionGroupRef = { title: string; slug: string };

type CatalogueArtwork = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  description: string | null;
  pricePence: number;
  stockOnHand: number | null;
  status: string;
  previewUrl: string | null;
  updatedAt: Date;
  collection: { id: string; name: string; slug: string } | null;
  assets: Array<{ id: string; storageKey: string; kind: string }>;
};

type PublicArtworkAsset = { id: string; kind: string };

type PublicArtwork = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  description: string | null;
  pricePence: number;
  stockOnHand: number | null;
  status: string;
  collection: { id: string; name: string; slug: string } | null;
  groups: CollectionGroupRef[];
  assets: PublicArtworkAsset[];
  previewUrl: string | null;
  publicImageUrl: string | null;
  imageUrl: string | null;
  isDownloadAvailable: boolean;
  updatedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  location: string | null;
  eventName: string | null;
  subjectTags: string[];
  previewAlt: string | null;
};

type ShopFilterOption = { label: string; slug: string; count: number };

const PUBLIC_PREVIEW_KINDS = new Set(["WATERMARKED_PREVIEW", "PREVIEW"]);
const DOWNLOAD_ONLY_KINDS = new Set(["ORIGINAL", "DOWNLOAD_MASTER"]);

export type ShopArtworkFilters = { group?: string | null; collection?: string | null; category?: string | null };
export type ShopFilterOptions = { groups: ShopFilterOption[]; collections: ShopFilterOption[]; categories: ShopFilterOption[] };

function pickPreviewAsset(assets: CatalogueArtwork["assets"]) {
  return assets.find((asset) => asset.kind === "WATERMARKED_PREVIEW") ?? assets.find((asset) => asset.kind === "PREVIEW") ?? null;
}

function hasDbDownloadAsset(assets: CatalogueArtwork["assets"]) {
  return assets.some((asset) => DOWNLOAD_ONLY_KINDS.has(asset.kind));
}

function resolvePublicPreviewAssetUrl(asset: CatalogueArtwork["assets"][number] | null): string | null {
  if (!asset || !PUBLIC_PREVIEW_KINDS.has(asset.kind)) return null;
  try { return getPublicObjectUrl(asset.storageKey); } catch { return null; }
}

function previewUrlFromDb(artwork: CatalogueArtwork): string | null {
  if (!artwork.previewUrl) return null;
  try { return createPublicHostedImageUrl(artwork.previewUrl, { width: 1600 }); } catch { return null; }
}

function slugifyFilterLabel(value: string | null | undefined) { return normalizeCollectionSlug(value ?? ""); }

function toPublicArtwork(artwork: CatalogueArtwork): PublicArtwork {
  const previewAsset = pickPreviewAsset(artwork.assets);
  const dbPreviewUrl = previewUrlFromDb(artwork);
  const publicPreviewAssetUrl = resolvePublicPreviewAssetUrl(previewAsset);
  const previewUrl = dbPreviewUrl ?? publicPreviewAssetUrl ?? (previewAsset ? createSignedStoragePreviewUrl(previewAsset.storageKey, artwork.title) : null);
  const safeAssets: PublicArtworkAsset[] = artwork.assets.map((asset) => ({ id: asset.id, kind: asset.kind }));

  return {
    ...artwork,
    groups: [],
    assets: safeAssets,
    previewUrl,
    publicImageUrl: publicPreviewAssetUrl ?? previewUrl,
    imageUrl: previewUrl,
    isDownloadAvailable: hasDbDownloadAsset(artwork.assets),
    updatedAt: artwork.updatedAt instanceof Date ? artwork.updatedAt.toISOString() : String(artwork.updatedAt),
    seoTitle: null,
    seoDescription: null,
    seoKeywords: [],
    location: null,
    eventName: null,
    subjectTags: [],
    previewAlt: artwork.title,
  };
}

function sortPublicArtworks(artworks: PublicArtwork[]) {
  return [...artworks].sort((left, right) => (Date.parse(right.updatedAt ?? "") || 0) - (Date.parse(left.updatedAt ?? "") || 0));
}

function applyArtworkFilters(artworks: PublicArtwork[], filters: ShopArtworkFilters = {}) {
  const groupFilter = slugifyFilterLabel(filters.group);
  const collectionFilter = slugifyFilterLabel(filters.collection);
  const categoryFilter = slugifyFilterLabel(filters.category);
  return artworks.filter((artwork) => {
    const matchesGroup = groupFilter ? artwork.groups.some((group) => group.slug === groupFilter) : true;
    const matchesCollection = collectionFilter ? artwork.collection?.slug === collectionFilter : true;
    const matchesCategory = categoryFilter ? slugifyFilterLabel(artwork.category) === categoryFilter : true;
    return matchesGroup && matchesCollection && matchesCategory;
  });
}

function toFilterOptions(records: Array<{ label: string; slug: string }>) {
  const grouped = new Map<string, ShopFilterOption>();
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

async function loadPublishedArtworks(): Promise<PublicArtwork[]> {
  let artworks: CatalogueArtwork[] = [];

  try {
    artworks = (await db.artwork.findMany({
      where: { status: "PUBLISHED" },
      include: { assets: true, collection: true },
      orderBy: { createdAt: "desc" },
    })) as CatalogueArtwork[];
  } catch {
    artworks = [];
  }

  return sortPublicArtworks(artworks.map(toPublicArtwork).filter((work) => !isRetiredShopArtwork(work)));
}

export async function listPublishedArtworks(filters: ShopArtworkFilters = {}) {
  const artworks = await loadPublishedArtworks();
  return applyArtworkFilters(artworks, filters);
}

export async function getShopFilterOptions(): Promise<ShopFilterOptions> {
  const artworks = await loadPublishedArtworks();
  return {
    groups: toFilterOptions(artworks.flatMap((artwork) => artwork.groups.map((group) => ({ label: group.title, slug: group.slug })))),
    collections: toFilterOptions(artworks.map((artwork) => artwork.collection ? { label: artwork.collection.name, slug: artwork.collection.slug } : null).filter((value): value is { label: string; slug: string } => Boolean(value))),
    categories: toFilterOptions(artworks.map((artwork) => artwork.category ? { label: artwork.category, slug: slugifyFilterLabel(artwork.category) } : null).filter((value): value is { label: string; slug: string } => Boolean(value))),
  };
}

export async function getPublishedArtworkBySlug(slug: string) {
  let artwork: CatalogueArtwork | null = null;

  try {
    artwork = (await db.artwork.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { assets: true, collection: true },
    })) as CatalogueArtwork | null;
  } catch {
    artwork = null;
  }

  if (!artwork) return null;
  const result = toPublicArtwork(artwork);
  return isRetiredShopArtwork(result) ? null : result;
}

export type PublishedArtwork = PublicArtwork;

export async function listPublishedCategories() {
  const { categories } = await getShopFilterOptions();
  return categories.map((category) => category.label);
}

export async function listCollectionAssets(collectionSlug: string) {
  const assets = await db.artworkAsset.findMany({
    where: { storageKey: { startsWith: `collections/${collectionSlug}/` } },
    include: { artwork: { select: { id: true, title: true, slug: true, collectionId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return assets.map((a: any) => ({
    id: a.id,
    kind: a.kind,
    storageKey: a.storageKey,
    mimeType: a.mimeType,
    bytes: a.bytes,
    artwork: a.artwork ? { id: a.artwork.id, title: a.artwork.title, slug: a.artwork.slug } : null,
  }));
}
