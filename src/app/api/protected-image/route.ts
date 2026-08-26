import { NextResponse } from "next/server";
import {
  isAllowedImageUrl,
  verifyProtectedImageRequest,
} from "@/lib/protected-images";
import { renderProtectedHostedPreview } from "@/lib/watermark";

export const runtime = "nodejs";

function getCacheControl(expiresAt: number) {
  const ttl = Math.max(1, expiresAt - Math.floor(Date.now() / 1000));
  return `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=60`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const encodedSource = searchParams.get("src");
  const encodedLabel = searchParams.get("label");

  if (!encodedSource || !encodedLabel) {
    return new NextResponse("Missing image parameters.", { status: 400 });
  }

  let verified;
  try {
    verified = verifyProtectedImageRequest({
      encodedSource,
      width: searchParams.get("w"),
      encodedLabel,
      expiresAt: searchParams.get("exp"),
      signature: searchParams.get("sig"),
    });
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Invalid image request.",
      { status: 403 },
    );
  }

  if (!isAllowedImageUrl(verified.rawUrl)) {
    return new NextResponse("Image host is not permitted.", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(verified.rawUrl, {
      headers: {
        "user-agent": "Errant-Arts Image Proxy",
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      next: {
        revalidate: Math.max(1, verified.expiresAt - Math.floor(Date.now() / 1000)),
      },
    });
  } catch {
    return new NextResponse("Unable to load source image.", { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse("Unable to load source image.", { status: 502 });
  }

  const sourceBuffer = Buffer.from(await upstream.arrayBuffer());
  const cacheControl = getCacheControl(verified.expiresAt);
  let output: Buffer | null = null;

  try {
    output = await renderProtectedHostedPreview(sourceBuffer, verified.label, {
      targetWidth: verified.width,
      quality: 82,
    });
  } catch (error) {
    console.warn("[protected-image] watermark transform failed, serving source image", error);
  }

  if (!output) {
    const filename =
      verified.label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "protected-preview";

    return new NextResponse(new Uint8Array(sourceBuffer), {
      status: 200,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/octet-stream",
        "cache-control": cacheControl,
        "cross-origin-resource-policy": "same-origin",
        "content-disposition": `inline; filename="${filename}"`,
        "referrer-policy": "no-referrer",
        "x-errant-preview-mode": "proxy",
        "x-robots-tag": "noimageindex, noindex, noarchive",
        "content-length": String(sourceBuffer.length),
      },
    });
  }

  return new NextResponse(new Uint8Array(output), {
    status: 200,
    headers: {
      "content-type": "image/webp",
      "cache-control": cacheControl,
      "cross-origin-resource-policy": "same-origin",
      "content-disposition": 'inline; filename="preview.webp"',
      "referrer-policy": "no-referrer",
      "x-robots-tag": "noimageindex, noindex, noarchive",
      "content-length": String(output.length),
    },
  });
}
