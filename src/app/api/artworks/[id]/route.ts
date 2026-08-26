import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { syncCollectionManifest, upsertCollectionManifestWork } from "@/lib/r2-collections";
import { deleteObject } from "@/lib/storage";
import { isAllowedImageUrl } from "@/lib/protected-images";

const updateArtworkSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  category: z.string().trim().max(120).optional().or(z.literal("")),
  pricePence: z.number().int().nonnegative(),
  stockOnHand: z.number().int().nonnegative().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  previewUrl: z.string().trim().url().nullable().optional(),
  originalStorageKey: z.string().trim().max(1000).optional().or(z.literal("")),
});

function inferMimeType(storageKey: string) {
  const lower = storageKey.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".tif") || lower.endsWith(".tiff")) return "image/tiff";
  return "image/jpeg";
}

async function applyOriginalStorageKeyCorrection(input: {
  artworkId: string;
  currentOriginalAssetId: string | null;
  requestedStorageKey: string | null;
}) {
  const requestedStorageKey = input.requestedStorageKey?.trim() || null;
  if (!requestedStorageKey) return;

  const sameKeyAsset = await db.artworkAsset.findUnique({ where: { storageKey: requestedStorageKey } });
  if (sameKeyAsset && sameKeyAsset.artworkId !== input.artworkId) {
    throw new Error("That original storage key is already linked to another artwork. Move or rename the R2 object before assigning it here.");
  }

  const correctionData = {
    kind: "ORIGINAL",
    mimeType: inferMimeType(requestedStorageKey),
    checksum: `manual-correction:${new Date().toISOString()}`,
  };

  if (sameKeyAsset) {
    await db.artworkAsset.update({ where: { id: sameKeyAsset.id }, data: correctionData });
    if (input.currentOriginalAssetId && input.currentOriginalAssetId !== sameKeyAsset.id) {
      await db.artworkAsset.delete({ where: { id: input.currentOriginalAssetId } });
    }
    return;
  }

  if (input.currentOriginalAssetId) {
    await db.artworkAsset.update({ where: { id: input.currentOriginalAssetId }, data: { ...correctionData, storageKey: requestedStorageKey } });
    return;
  }

  await db.artworkAsset.create({
    data: {
      artworkId: input.artworkId,
      kind: "ORIGINAL",
      storageKey: requestedStorageKey,
      mimeType: inferMimeType(requestedStorageKey),
      bytes: 0,
      checksum: `manual-correction:${new Date().toISOString()}`,
    },
  });
}

async function hardDeleteArtwork(input: { id: string; deleteFiles: boolean }) {
  const artwork = await db.artwork.findUnique({ where: { id: input.id }, include: { collection: true, assets: true } });
  if (!artwork) return { artwork: null, storageKeys: [] as string[] };

  const storageKeys = artwork.assets.map((asset) => asset.storageKey);

  await db.$transaction(async (tx) => {
    await tx.printOrder.deleteMany({ where: { artworkId: input.id } });
    await tx.downloadEntitlement.deleteMany({ where: { artworkId: input.id } });
    await tx.orderItem.deleteMany({ where: { artworkId: input.id } });
    await tx.artworkAsset.deleteMany({ where: { artworkId: input.id } });
    await tx.artwork.delete({ where: { id: input.id } });
  });

  if (input.deleteFiles) {
    for (const storageKey of storageKeys) {
      await deleteObject(storageKey).catch(() => null);
    }
  }

  if (artwork.collection) await syncCollectionManifest(artwork.collection.slug).catch(() => null);
  return { artwork, storageKeys };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const payload = updateArtworkSchema.parse(await req.json());

    if (payload.previewUrl && !isAllowedImageUrl(payload.previewUrl)) {
      throw new Error("Preview URL must use an approved image domain.");
    }

    const existing = await db.artwork.findUnique({ where: { id }, include: { collection: true, assets: true } });
    if (!existing) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });

    const requestedOriginalStorageKey = payload.originalStorageKey?.trim() || null;
    const existingOriginal = existing.assets.find((asset) => asset.kind === "ORIGINAL") ?? null;

    if (requestedOriginalStorageKey && existingOriginal?.storageKey !== requestedOriginalStorageKey) {
      await applyOriginalStorageKeyCorrection({ artworkId: existing.id, currentOriginalAssetId: existingOriginal?.id ?? null, requestedStorageKey: requestedOriginalStorageKey });
    }

    const artwork = await db.artwork.update({
      where: { id },
      data: {
        title: payload.title,
        slug: payload.slug,
        description: payload.description || null,
        category: payload.category || null,
        pricePence: payload.pricePence,
        stockOnHand: payload.stockOnHand ?? null,
        status: payload.status,
        previewUrl: payload.previewUrl || null,
      },
      include: { collection: true, assets: true },
    });

    const original = artwork.assets.find((asset) => asset.kind === "ORIGINAL");
    const preview = artwork.assets.find((asset) => asset.kind === "WATERMARKED_PREVIEW" || asset.kind === "PREVIEW");
    if (artwork.collection && original) {
      await upsertCollectionManifestWork({
        folderName: artwork.collection.slug,
        collectionName: artwork.collection.name,
        work: {
          id: artwork.id,
          slug: artwork.slug,
          title: artwork.title,
          year: String(new Date().getUTCFullYear()),
          category: artwork.category ?? undefined,
          pricePence: artwork.pricePence,
          currency: artwork.currency,
          storageKey: original.storageKey,
          previewStorageKey: preview?.storageKey ?? null,
          publicImageUrl: artwork.previewUrl,
          status: artwork.status,
          updatedAt: artwork.updatedAt.toISOString(),
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/artworks");
    revalidatePath("/admin/shop-readiness");
    revalidatePath(`/work/${artwork.slug}`);
    if (existing.slug !== artwork.slug) revalidatePath(`/work/${existing.slug}`);

    await writeAuditLog({
      userId: admin.id,
      action: "artwork.update",
      entityType: "Artwork",
      entityId: artwork.id,
      metadata: { previousSlug: existing.slug, slug: artwork.slug, status: artwork.status, originalStorageKey: original?.storageKey ?? null, previewStorageKey: preview?.storageKey ?? null },
    });

    return NextResponse.json({ artwork });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update artwork.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const url = new URL(req.url);
    const deleteFiles = url.searchParams.get("deleteFiles") === "true";
    const permanent = url.searchParams.get("permanent") === "true";

    const artwork = await db.artwork.findUnique({
      where: { id },
      include: {
        collection: true,
        assets: true,
        orderItems: { include: { order: { select: { id: true, status: true, stripeCheckoutId: true, stripePaymentIntentId: true } } } },
        entitlements: { include: { order: { select: { id: true, status: true, stripeCheckoutId: true, stripePaymentIntentId: true } } } },
        printOrders: { include: { order: { select: { id: true, status: true, stripeCheckoutId: true, stripePaymentIntentId: true } } } },
      },
    });

    if (!artwork) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });

    const realCustomerStatuses = new Set(["PAID", "FULFILLED", "REFUNDED"]);
    const linkedOrders = [
      ...artwork.orderItems.map((item) => item.order),
      ...artwork.entitlements.map((item) => item.order),
      ...artwork.printOrders.map((item) => item.order),
    ];
    const hasRealCustomerHistory = linkedOrders.some((order) =>
      realCustomerStatuses.has(order.status) && Boolean(order.stripeCheckoutId || order.stripePaymentIntentId),
    );
    const hasAnyLinkedHistory = artwork.orderItems.length > 0 || artwork.entitlements.length > 0 || artwork.printOrders.length > 0;

    if (permanent) {
      if (hasRealCustomerHistory) {
        return NextResponse.json(
          { error: "This artwork has real paid/refunded/fulfilled customer history, so it cannot be permanently deleted. It can only be removed from the public website." },
          { status: 409 },
        );
      }

      const deleted = await hardDeleteArtwork({ id, deleteFiles });
      if (!deleted.artwork) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });

      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/admin/artworks");
      revalidatePath("/admin/shop-readiness");
      revalidatePath(`/work/${deleted.artwork.slug}`);

      await writeAuditLog({
        userId: admin.id,
        action: "artwork.permanent-delete-test-record",
        entityType: "Artwork",
        entityId: id,
        metadata: { slug: deleted.artwork.slug, deleteFiles, storageKeys: deleted.storageKeys, removedLinkedTestRows: hasAnyLinkedHistory },
      });

      return NextResponse.json({ success: true, permanentlyDeleted: true, deletedFiles: deleteFiles ? deleted.storageKeys : [] });
    }

    if (hasRealCustomerHistory) {
      const removed = await db.artwork.update({ where: { id }, data: { status: "ARCHIVED" } });
      if (artwork.collection) await syncCollectionManifest(artwork.collection.slug).catch(() => null);

      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/admin/artworks");
      revalidatePath("/admin/shop-readiness");
      revalidatePath(`/work/${artwork.slug}`);

      await writeAuditLog({ userId: admin.id, action: "artwork.delete-from-website-preserve-downloads", entityType: "Artwork", entityId: id, metadata: { slug: artwork.slug, preservedForCustomerDownloads: true, requestedDeleteFiles: deleteFiles } });

      return NextResponse.json({ success: true, deletedFromWebsite: true, preservedForCustomerDownloads: true, artwork: removed, message: "Artwork removed from the public website. Customer download entitlements and R2 files have been preserved." });
    }

    const deleted = await hardDeleteArtwork({ id, deleteFiles });
    if (!deleted.artwork) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/artworks");
    revalidatePath("/admin/shop-readiness");
    revalidatePath(`/work/${deleted.artwork.slug}`);

    await writeAuditLog({ userId: admin.id, action: "artwork.delete", entityType: "Artwork", entityId: id, metadata: { slug: deleted.artwork.slug, deleteFiles, storageKeys: deleted.storageKeys, removedLinkedTestRows: hasAnyLinkedHistory } });

    return NextResponse.json({ success: true, permanentlyDeleted: true, deletedFiles: deleteFiles ? deleted.storageKeys : [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete artwork.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
