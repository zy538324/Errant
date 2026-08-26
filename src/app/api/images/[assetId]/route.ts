import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getObjectBuffer } from "@/lib/storage";
import {
  getPreviewCacheControl,
  renderWatermarkedPreview,
  verifySignedPreviewUrl,
} from "@/lib/watermark";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const { searchParams } = new URL(req.url);
    const expires = searchParams.get("expires") ?? "";
    const signature = searchParams.get("signature") ?? "";
    const verifiedSignature = verifySignedPreviewUrl(assetId, expires, signature);

    if (!verifiedSignature) {
      return NextResponse.json({ error: "Invalid or expired preview signature." }, { status: 403 });
    }

    const asset = await db.artworkAsset.findUnique({
      where: { id: assetId },
      include: { artwork: { select: { title: true, status: true } } },
    });

    if (!asset || asset.artwork.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Preview unavailable." }, { status: 404 });
    }

    const original = await getObjectBuffer(asset.storageKey);
    const cacheControl = getPreviewCacheControl(verifiedSignature.expiresAt);
    let preview: Buffer | null = null;

    try {
      preview = await renderWatermarkedPreview(original.body, asset.artwork.title);
    } catch (error) {
      console.warn(
        "[images/asset] watermark transform failed, serving source image",
        error,
      );
    }

    if (!preview) {
      return new NextResponse(new Uint8Array(original.body), {
        status: 200,
        headers: {
          "content-type": asset.mimeType || original.contentType,
          "cache-control": cacheControl,
          "content-disposition": `inline; filename="${asset.artwork.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-preview"`,
          "x-errant-preview-mode": "proxy",
          "x-robots-tag": "noindex, noimageindex, noarchive",
        },
      });
    }

    return new NextResponse(new Uint8Array(preview), {
      status: 200,
      headers: {
        "content-type": "image/jpeg",
        "cache-control": cacheControl,
        "content-disposition": `inline; filename="${asset.artwork.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-preview.jpg"`,
        "x-robots-tag": "noindex, noimageindex, noarchive",
      },
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Preview unavailable.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
