import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureWatermarkedCollectionThumbnail, syncCollectionManifest } from "@/lib/r2-collections";
import { getPublicObjectUrl } from "@/lib/storage";
import { getArtworkOriginalAsset, getArtworkPreviewAsset } from "@/lib/admin-readiness";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const artwork = await db.artwork.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { collection: true, assets: true },
    });

    if (!artwork) {
      return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
    }

    const original = getArtworkOriginalAsset(artwork);
    if (!original) {
      return NextResponse.json({ error: "Original image missing. Upload or replace the image first." }, { status: 400 });
    }

    if (!artwork.collection) {
      return NextResponse.json({ error: "Artwork is not assigned to a collection." }, { status: 400 });
    }

    const currentPreview = getArtworkPreviewAsset(artwork);
    const generated = await ensureWatermarkedCollectionThumbnail({
      storageKey: original.storageKey,
      title: artwork.title,
      folderName: artwork.collection.slug,
      overwrite: true,
      existingPreviewStorageKey: currentPreview?.storageKey ?? null,
    });

    if (generated.storageKey === original.storageKey) {
      return NextResponse.json({ error: "Preview generation did not create a separate watermarked preview." }, { status: 400 });
    }

    const previewUrl = getPublicObjectUrl(generated.storageKey);

    await db.artworkAsset.upsert({
      where: { storageKey: generated.storageKey },
      update: {
        artworkId: artwork.id,
        kind: "WATERMARKED_PREVIEW",
        mimeType: generated.mimeType,
        bytes: generated.bytes,
        checksum: `regenerated:${new Date().toISOString()}`,
      },
      create: {
        artworkId: artwork.id,
        kind: "WATERMARKED_PREVIEW",
        storageKey: generated.storageKey,
        mimeType: generated.mimeType,
        bytes: generated.bytes,
        checksum: `regenerated:${new Date().toISOString()}`,
      },
    });

    const updated = await db.artwork.update({ where: { id: artwork.id }, data: { previewUrl }, include: { collection: true } });

    if (updated.collection) {
      await syncCollectionManifest(updated.collection.slug).catch(() => null);
    }

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/artworks");
    revalidatePath("/admin/shop-readiness");
    revalidatePath(`/work/${updated.slug}`);

    return NextResponse.json({ success: true, artworkId: artwork.id, previewUrl, previewStorageKey: generated.storageKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to regenerate preview.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
