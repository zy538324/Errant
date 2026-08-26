import "server-only";
import { getSanityWriteClient } from "@/sanity/lib/client";

type SyncArtworkToSanityInput = {
  artworkId: string;
  title: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  collectionSlug?: string | null;
  pricePence: number;
  stockOnHand?: number | null;
  currency: string;
  previewImageUrl?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  downloadFile?: {
    storageKey: string;
    mimeType: string;
    bytes: number;
    filename?: string | null;
    uploadedAt?: string | null;
  } | null;
};

export async function syncArtworkToSanity(input: SyncArtworkToSanityInput) {
  const client = getSanityWriteClient();
  if (!client) {
    return { synced: false as const, reason: "unconfigured" as const };
  }

  await client.createOrReplace({
    _id: `artwork.${input.slug}`,
    _type: "artwork",
    shopArtworkId: input.artworkId,
    title: input.title,
    slug: {
      _type: "slug",
      current: input.slug,
    },
    description: input.description ?? "",
    category: input.category ?? "",
    collectionSlug: input.collectionSlug ?? "",
    pricePence: input.pricePence,
    stockOnHand: typeof input.stockOnHand === "number" ? input.stockOnHand : null,
    currency: input.currency,
    previewImageUrl: input.previewImageUrl ?? "",
    downloadFile: input.downloadFile
      ? {
          _type: "r2DownloadFile",
          storageKey: input.downloadFile.storageKey,
          mimeType: input.downloadFile.mimeType,
          bytes: input.downloadFile.bytes,
          filename: input.downloadFile.filename ?? "",
          uploadedAt: input.downloadFile.uploadedAt ?? new Date().toISOString(),
        }
      : undefined,
    isPublished: input.status === "PUBLISHED",
  });

  return { synced: true as const };
}
