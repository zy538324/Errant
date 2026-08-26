import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import type { AssetKind } from "@/lib/enums";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { listPublishedArtworks } from "@/modules/catalogue";
import {
  ensureWatermarkedCollectionThumbnail,
  upsertCollectionManifestWork,
} from "@/lib/r2-collections";
import { getPublicObjectUrl } from "@/lib/storage";
import { isAllowedImageUrl } from "@/lib/protected-images";
import { artworkQuerySchema, createArtworkSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = artworkQuerySchema.parse(Object.fromEntries(searchParams.entries()));
  const sessionUser = await getSessionUser();
  const isAdmin = sessionUser?.role === "ADMIN";

  if (!isAdmin) {
    if (!query.publishedOnly) {
      return NextResponse.json({ error: "Admin access denied." }, { status: 403 });
    }

    const artworks = (await listPublishedArtworks()).filter((artwork) => {
      const matchesCollection = query.collection ? artwork.collection?.slug === query.collection : true;
      const matchesSearch = query.search
        ? [artwork.title, artwork.description ?? ""].join(" ").toLowerCase().includes(query.search.toLowerCase())
        : true;
      return matchesCollection && matchesSearch;
    });

    return NextResponse.json({ artworks });
  }

  const artworks = await db.artwork.findMany({
    where: {
      status: query.publishedOnly ? "PUBLISHED" : undefined,
      collection: query.collection ? { is: { slug: query.collection } } : undefined,
      OR: query.search ? [{ title: { contains: query.search } }, { description: { contains: query.search } }] : undefined,
    },
    include: { assets: true, collection: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ artworks });
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const payload = createArtworkSchema.parse(await req.json());

    if (payload.previewImageUrl && !isAllowedImageUrl(payload.previewImageUrl)) {
      throw new Error("The hosted preview URL must come from an approved image domain.");
    }

    const collection = await db.collection.upsert({
      where: { slug: payload.collectionSlug },
      update: { name: payload.collectionName },
      create: { slug: payload.collectionSlug, name: payload.collectionName },
    });

    const primaryUpload = payload.uploads[0];
    const previewAsset = primaryUpload
      ? await ensureWatermarkedCollectionThumbnail({
          storageKey: primaryUpload.storageKey,
          title: payload.title,
          folderName: payload.collectionSlug,
          overwrite: true,
        })
      : null;
    const persistedPreviewAsset = previewAsset && primaryUpload && previewAsset.storageKey !== primaryUpload.storageKey ? previewAsset : null;
    const generatedPreviewUrl = persistedPreviewAsset ? getPublicObjectUrl(persistedPreviewAsset.storageKey) : null;
    const publicPreviewUrl = payload.previewImageUrl || generatedPreviewUrl;

    const assetsToCreate: Prisma.ArtworkAssetCreateWithoutArtworkInput[] = [
      ...payload.uploads.map((upload) => ({
        kind: "ORIGINAL" as AssetKind,
        storageKey: upload.storageKey,
        mimeType: upload.mimeType,
        bytes: upload.bytes,
        checksum: upload.filename,
      })),
      ...(persistedPreviewAsset
        ? [
            {
              kind: "WATERMARKED_PREVIEW" as AssetKind,
              storageKey: persistedPreviewAsset.storageKey,
              mimeType: persistedPreviewAsset.mimeType,
              bytes: persistedPreviewAsset.bytes,
              checksum: primaryUpload?.filename ?? "watermarked-preview",
            },
          ]
        : []),
    ];

    const artwork = await db.artwork.create({
      data: {
        title: payload.title,
        slug: payload.slug,
        collectionId: collection.id,
        description: payload.description || null,
        category: payload.category || null,
        tagsJson: JSON.stringify(payload.tags ?? []),
        previewUrl: publicPreviewUrl,
        pricePence: payload.pricePence,
        stockOnHand: payload.stockOnHand ?? null,
        currency: payload.currency.toUpperCase(),
        status: payload.status,
        widthPx: payload.widthPx,
        heightPx: payload.heightPx,
        assets: { create: assetsToCreate },
      },
      include: { assets: true, collection: true },
    });

    if (primaryUpload) {
      await upsertCollectionManifestWork({
        folderName: payload.collectionSlug,
        collectionName: payload.collectionName,
        work: {
          id: artwork.id,
          slug: artwork.slug,
          title: artwork.title,
          year: String(new Date().getUTCFullYear()),
          category: artwork.category ?? undefined,
          pricePence: artwork.pricePence,
          currency: artwork.currency,
          storageKey: primaryUpload.storageKey,
          previewStorageKey: persistedPreviewAsset?.storageKey ?? null,
          publicImageUrl: publicPreviewUrl,
          status: artwork.status,
          updatedAt: artwork.updatedAt.toISOString(),
        },
      });
    }

    await writeAuditLog({
      userId: admin.id,
      action: "artwork.create",
      entityType: "Artwork",
      entityId: artwork.id,
      metadata: {
        slug: artwork.slug,
        collectionSlug: payload.collectionSlug,
        previewImageUrl: publicPreviewUrl,
        previewStorageKey: persistedPreviewAsset?.storageKey ?? null,
        uploads: payload.uploads.map((upload) => upload.storageKey),
      },
    });

    return NextResponse.json({ artwork }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create artwork.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
