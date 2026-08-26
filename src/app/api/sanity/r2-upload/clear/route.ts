import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSanityWriteClient } from "@/sanity/lib/client";
import {
  markUploadGrantUsed,
  requireSanityStudioUploadGrant,
} from "@/sanity/lib/studio-auth";

const clearSanityR2UploadSchema = z.object({
  documentId: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(180).optional().or(z.literal("")),
});

function getArtworkDocumentIds(documentId: string) {
  const id = documentId.trim();
  if (!id) return [];

  const publishedId = id.startsWith("drafts.") ? id.slice("drafts.".length) : id;
  const draftId = publishedId.startsWith("drafts.") ? publishedId : `drafts.${publishedId}`;

  return Array.from(new Set([id, publishedId, draftId]));
}

async function clearArtworkPreviewDocuments(
  sanity: NonNullable<ReturnType<typeof getSanityWriteClient>>,
  documentId: string,
) {
  const documentIds = getArtworkDocumentIds(documentId);
  if (documentIds.length === 0) return;

  let patched = false;
  let firstError: unknown = null;

  for (const id of documentIds) {
    try {
      await sanity.patchDocument(id, {
        unset: ["downloadFile", "previewImage", "previewImageUrl"],
      });
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
    const grant = await requireSanityStudioUploadGrant(req, {
      purposes: ["r2DownloadFileClear"],
    });
    const payload = clearSanityR2UploadSchema.parse(await req.json());

    const sanity = getSanityWriteClient();
    if (!sanity) {
      throw new Error("Sanity write access is not configured.");
    }

    await clearArtworkPreviewDocuments(sanity, payload.documentId);
    await markUploadGrantUsed(grant._id);
    revalidateArtworkPaths(payload.slug);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to clear upload.";
    const status =
      message.includes("upload access is required") ||
      message.includes("upload access denied")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
