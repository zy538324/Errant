import type { Artwork, ArtworkAsset, Collection } from "@prisma/client";
import { getPublicObjectUrl } from "@/lib/storage";

export type AdminArtworkWithRelations = Artwork & {
  collection: Collection | null;
  assets: ArtworkAsset[];
};

export type ArtworkReadinessCheck = {
  key: "original" | "preview" | "price" | "status" | "collection" | "slug";
  label: string;
  ok: boolean;
  reason: string;
};

export type ArtworkReadinessSummary = {
  isReady: boolean;
  checks: ArtworkReadinessCheck[];
  reasons: string[];
  originalAsset: ArtworkAsset | null;
  previewAsset: ArtworkAsset | null;
  previewUrl: string | null;
};

export function getArtworkOriginalAsset(artwork: AdminArtworkWithRelations) {
  return artwork.assets.find((asset) => asset.kind === "ORIGINAL") ?? null;
}

export function getArtworkPreviewAsset(artwork: AdminArtworkWithRelations) {
  return artwork.assets.find((asset) => asset.kind === "WATERMARKED_PREVIEW")
    ?? artwork.assets.find((asset) => asset.kind === "PREVIEW")
    ?? null;
}

export function getArtworkDisplayPreviewUrl(artwork: AdminArtworkWithRelations) {
  if (artwork.previewUrl?.trim()) return artwork.previewUrl;

  const previewAsset = getArtworkPreviewAsset(artwork);
  if (!previewAsset) return null;

  try {
    return getPublicObjectUrl(previewAsset.storageKey);
  } catch {
    return null;
  }
}

export function getArtworkReadiness(artwork: AdminArtworkWithRelations): ArtworkReadinessSummary {
  const originalAsset = getArtworkOriginalAsset(artwork);
  const previewAsset = getArtworkPreviewAsset(artwork);
  const previewUrl = getArtworkDisplayPreviewUrl(artwork);

  const checks: ArtworkReadinessCheck[] = [
    {
      key: "original",
      label: "Original",
      ok: Boolean(originalAsset),
      reason: originalAsset
        ? "Original source image is linked."
        : "Original source image is missing. Upload or replace the artwork image before publishing.",
    },
    {
      key: "preview",
      label: "Watermarked preview",
      ok: Boolean(previewAsset || artwork.previewUrl?.trim()),
      reason: previewAsset || artwork.previewUrl?.trim()
        ? "Watermarked preview is linked."
        : "Watermarked preview is missing. Use Generate Preview to rebuild it from the original image.",
    },
    {
      key: "price",
      label: "Price",
      ok: artwork.pricePence > 0,
      reason: artwork.pricePence > 0
        ? "Artwork has a sale price."
        : "Price is missing or set to zero. Add a price before publishing to the shop.",
    },
    {
      key: "status",
      label: "Visibility",
      ok: artwork.status === "PUBLISHED",
      reason: artwork.status === "PUBLISHED"
        ? "Artwork is published."
        : `Artwork is currently ${artwork.status.toLowerCase()}. Use Quick Publish once image and price checks pass.`,
    },
    {
      key: "collection",
      label: "Collection",
      ok: Boolean(artwork.collectionId && artwork.collection),
      reason: artwork.collectionId && artwork.collection
        ? "Artwork is assigned to a collection."
        : "Artwork is not assigned to a collection. Assign it so it appears in the correct portfolio/shop grouping.",
    },
    {
      key: "slug",
      label: "Slug",
      ok: Boolean(artwork.slug?.trim()),
      reason: artwork.slug?.trim()
        ? "Artwork has a usable URL slug."
        : "Artwork slug is missing. Add a slug so the public artwork page can resolve correctly.",
    },
  ];

  const reasons = checks.filter((check) => !check.ok).map((check) => check.reason);

  return {
    isReady: reasons.length === 0,
    checks,
    reasons,
    originalAsset,
    previewAsset,
    previewUrl,
  };
}

export function serialiseArtworkReadiness(artwork: AdminArtworkWithRelations) {
  const readiness = getArtworkReadiness(artwork);

  return {
    id: artwork.id,
    title: artwork.title,
    slug: artwork.slug,
    collection: artwork.collection?.name ?? "Unassigned",
    collectionSlug: artwork.collection?.slug ?? null,
    pricePence: artwork.pricePence,
    currency: artwork.currency,
    status: artwork.status,
    previewUrl: readiness.previewUrl,
    originalStorageKey: readiness.originalAsset?.storageKey ?? null,
    previewStorageKey: readiness.previewAsset?.storageKey ?? null,
    checks: readiness.checks,
    reasons: readiness.reasons,
    isReady: readiness.isReady,
  };
}
