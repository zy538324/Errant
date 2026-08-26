import { NextResponse } from "next/server";
import { getObjectBuffer } from "@/lib/storage";
import {
  getPreviewCacheControl,
  renderWatermarkedPreview,
  verifySignedStoragePreviewRequest,
} from "@/lib/watermark";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") ?? "";
    const title = searchParams.get("title") ?? "";
    const mode = searchParams.get("mode");
    const expires = searchParams.get("expires") ?? "";
    const signature = searchParams.get("signature") ?? "";

    const verified = verifySignedStoragePreviewRequest(
      token,
      title,
      expires,
      signature,
      mode,
    );
    const cacheControl = getPreviewCacheControl(verified.expiresAt);

    const object = await getObjectBuffer(verified.storageKey);

    if (verified.mode === "proxy") {
      const filename =
        verified.storageKey.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "-") ??
        "protected-preview";

      return new NextResponse(new Uint8Array(object.body), {
        status: 200,
        headers: {
          "content-type": object.contentType,
          "cache-control": cacheControl,
          "content-disposition": `inline; filename="${filename}"`,
          "cross-origin-resource-policy": "same-origin",
          "referrer-policy": "no-referrer",
          "x-robots-tag": "noindex, noimageindex, noarchive",
        },
      });
    }

    let preview: Buffer | null = null;
    try {
      preview = await renderWatermarkedPreview(object.body, verified.title);
    } catch (error) {
      console.warn(
        "[images/storage] watermark transform failed, serving source image",
        error,
      );
    }

    if (!preview) {
      return new NextResponse(new Uint8Array(object.body), {
        status: 200,
        headers: {
          "content-type": object.contentType,
          "cache-control": cacheControl,
          "content-disposition": 'inline; filename="protected-preview"',
          "cross-origin-resource-policy": "same-origin",
          "referrer-policy": "no-referrer",
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
        "content-disposition": 'inline; filename="protected-preview.jpg"',
        "cross-origin-resource-policy": "same-origin",
        "referrer-policy": "no-referrer",
        "x-robots-tag": "noindex, noimageindex, noarchive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview unavailable.";
    const status = message.includes("preview signature") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
