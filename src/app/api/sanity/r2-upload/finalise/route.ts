import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getObjectBuffer } from "@/lib/storage";
import { renderWatermarkedPreview } from "@/lib/watermark";
import { getSanityWriteClient } from "@/sanity/lib/client";
import {
  assertUploadGrantMatches,
  markUploadGrantUsed,
  requireSanityStudioUploadGrant,
} from "@/sanity/lib/studio-auth";

const finaliseSanityR2UploadSchema = z.object({
  storageKey: z.string().trim().min(1).max(500),
  filename: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(1).max(120),
  bytes: z.number().int().nonnegative(),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  documentId: z.string().trim().min(1).max(200).optional().or(z.literal("")),
  slug: z.string().trim().min(1).max(180).optional().or(z.literal("")),
});

function previewFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${base || "artwork"}-watermarked-preview.jpg`;
}

function getArtworkDocumentIds(documentId: string) {
  const id = documentId.trim();
  if (!id) return [];

  const publishedId = id.startsWith("drafts.") ? id.slice("drafts.".length) : id;
  const draftId = publishedId.startsWith("drafts.") ? publishedId : `drafts.${publishedId}`;

  return Array.from(new Set([id, publishedId, draftId]));
}

async function patchArtworkPreviewDocuments(
  sanity: NonNullable<ReturnType<typeof getSanityWriteClient>>,
  documentId: string,
  fields: Record<string, unknown>,
) {
  const documentIds = getArtworkDocumentIds(documentId);
  if (documentIds.length === 0) return;

  let patched = false;
  let firstError: unknown = null;

  for (const id of documentIds) {
    try {
      await sanity.patchDocument(id, { set: fields });
      patched = true;
    } catch (error) {
      firstError ??= error;
    }
  }

  if (!patched && firstError) {
    throw firstError;
  }
}

function revalidateArtworkPaths(slug?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  if (slug?.trim()) {
    revalidatePath(`/work/${slug.trim()}`);
  }
}

export async function POST(req: Request) {
  try {
    const grant = await requireSanityStudioUploadGrant(req);
    const payload = finaliseSanityR2UploadSchema.parse(await req.json());
    assertUploadGrantMatches(grant, {
      filename: payload.filename,
      mimeType: payload.mimeType,
      bytes: payload.bytes,
      storageKey: payload.storageKey,
    });

    const sanity = getSanityWriteClient();
    if (!sanity) {
      throw new Error("Sanity write access is not configured.");
    }

    const original = await getObjectBuffer(payload.storageKey);
    const preview = await renderWatermarkedPreview(
      original.body,
      payload.title?.trim() || payload.filename,
      {
        targetWidth: 1600,
        quality: 82,
      },
    );

    if (!preview) {
      throw new Error("Unable to generate a watermarked preview for this image.");
    }

    const asset = await sanity.uploadImageAsset({
      body: preview,
      filename: previewFilename(payload.filename),
      contentType: "image/jpeg",
    });
    const downloadFile = {
      _type: "r2DownloadFile" as const,
      storageKey: payload.storageKey,
      mimeType: payload.mimeType,
      bytes: payload.bytes,
      filename: payload.filename,
      uploadedAt: new Date().toISOString(),
    };
    const previewImage = {
      _type: "image" as const,
      asset: {
        _type: "reference" as const,
        _ref: asset.assetId,
      },
    };

    if (payload.documentId?.trim()) {
      await patchArtworkPreviewDocuments(sanity, payload.documentId, {
        downloadFile,
        previewImage,
        previewImageUrl: asset.url,
      });
    }
    await markUploadGrantUsed(grant._id);
    revalidateArtworkPaths(payload.slug);

    return NextResponse.json({
      downloadFile,
      previewImage,
      previewImageUrl: asset.url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to finalise upload.";
    const status =
      message.includes("upload access is required") ||
      message.includes("upload access denied")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
