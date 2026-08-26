import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteObject, getObjectBuffer, getPublicObjectUrl, putObjectBuffer } from "@/lib/storage";
import { renderWatermarkedPreview } from "@/lib/watermark";
import { syncCollectionManifest } from "@/lib/r2-collections";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const replaceImageSchema = z.object({
  upload: z.object({
    storageKey: z.string().min(1),
    filename: z.string().trim().min(1).max(200),
    mimeType: z.string().trim().min(1),
    bytes: z.number().int().positive(),
  }),
  deleteOldFiles: z.boolean().optional().default(false),
});

function buildWatermarkedStorageKey(originalStorageKey: string) {
  const collection = originalStorageKey.match(/^collections\/([^/]+)\//)?.[1] ?? "studio";
  const filename = originalStorageKey.split("/").pop() ?? "preview.jpg";
  const base = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-watermarked$/i, "") || "preview";
  return `collections/${collection}/watermarked/${base}-watermarked.jpg`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const payload = replaceImageSchema.parse(await req.json());
    const artwork = await db.artwork.findUnique({ where: { id }, include: { assets: true, collection: true } });
    if (!artwork) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });

    const previousKeys = artwork.assets.map((asset) => asset.storageKey);
    const source = await getObjectBuffer(payload.upload.storageKey);
    const watermarked = await renderWatermarkedPreview(source.body, artwork.title, { targetWidth: 1600, quality: 82 });
    if (!watermarked) return NextResponse.json({ error: "The image uploaded, but the watermarked preview could not be generated." }, { status: 500 });

    const previewStorageKey = buildWatermarkedStorageKey(payload.upload.storageKey);
    await putObjectBuffer(previewStorageKey, watermarked, "image/jpeg", { cacheControl: "public, max-age=31536000, immutable" });
    const previewUrl = getPublicObjectUrl(previewStorageKey);

    await db.artworkAsset.deleteMany({ where: { artworkId: id, kind: { in: ["ORIGINAL", "WATERMARKED_PREVIEW", "PREVIEW"] } } });
    await db.artworkAsset.createMany({
      data: [
        { artworkId: id, kind: "ORIGINAL", storageKey: payload.upload.storageKey, mimeType: payload.upload.mimeType, bytes: payload.upload.bytes, checksum: payload.upload.filename },
        { artworkId: id, kind: "WATERMARKED_PREVIEW", storageKey: previewStorageKey, mimeType: "image/jpeg", bytes: watermarked.length, checksum: "admin-replaced-watermarked-preview" },
      ],
    });

    const updated = await db.artwork.update({ where: { id }, data: { previewUrl }, include: { assets: true, collection: true } });

    if (payload.deleteOldFiles) {
      for (const key of previousKeys) await deleteObject(key).catch(() => null);
    }

    if (updated.collection) await syncCollectionManifest(updated.collection.slug).catch(() => null);
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/work/${updated.slug}`);
    revalidatePath("/admin/artworks");
    revalidatePath("/admin/shop-readiness");

    await writeAuditLog({
      userId: admin.id,
      action: "artwork.image.replace",
      entityType: "Artwork",
      entityId: id,
      metadata: { newOriginal: payload.upload.storageKey, previewStorageKey, deleteOldFiles: payload.deleteOldFiles, previousKeys },
    });

    return NextResponse.json({ artwork: updated, previewUrl, previewStorageKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to replace artwork image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
