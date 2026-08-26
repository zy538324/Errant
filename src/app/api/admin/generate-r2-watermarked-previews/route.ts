import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getObjectBuffer,
  getPublicObjectUrl,
  listCollectionObjects,
  listTopLevelCollectionFolders,
  putObjectBuffer,
} from "@/lib/storage";
import { renderWatermarkedPreview } from "@/lib/watermark";
import { upsertCollectionManifestWork } from "@/lib/r2-collections";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  dryRun: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(250).optional().default(50),
  overwrite: z.boolean().optional().default(false),
  source: z.enum(["db", "r2", "both"]).optional().default("db"),
});

type SourceCandidate = {
  artworkId?: string;
  artworkSlug?: string;
  title: string;
  collectionSlug: string;
  collectionName?: string;
  originalStorageKey: string;
  pricePence?: number;
  currency?: string;
  status?: string;
  category?: string | null;
  updatedAt?: string;
};

function isImageKey(storageKey: string) {
  return /\.(jpe?g|png|webp|avif|tif|tiff)$/i.test(storageKey);
}

function isProcessableOriginal(storageKey: string) {
  if (!storageKey.startsWith("collections/")) return false;
  if (!isImageKey(storageKey)) return false;
  if (storageKey.includes("/thumbs/")) return false;
  if (storageKey.includes("/watermarked/")) return false;
  if (storageKey.endsWith("/manifest.json")) return false;
  return true;
}

function filenameWithoutExtension(filename: string) {
  return filename.replace(/\.[^.]+$/, "");
}

function safeOutputBase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || "watermarked-preview";
}

function collectionSlugFromStorageKey(storageKey: string) {
  return storageKey.match(/^collections\/([^/]+)\//)?.[1] ?? "studio";
}

function titleFromStorageKey(storageKey: string) {
  const filename = storageKey.split("/").pop() ?? "Artwork";
  return filenameWithoutExtension(filename)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Artwork";
}

function buildWatermarkedStorageKey(originalStorageKey: string) {
  const collectionSlug = collectionSlugFromStorageKey(originalStorageKey);
  const filename = originalStorageKey.split("/").pop() ?? "preview.jpg";
  const base = safeOutputBase(filenameWithoutExtension(filename).replace(/-watermarked$/i, ""));
  return `collections/${collectionSlug}/watermarked/${base}-watermarked.jpg`;
}

async function requireMigrationAccess(req: Request, queryToken?: string | null) {
  const configuredToken = process.env.ADMIN_MIGRATION_TOKEN?.trim();
  const suppliedToken = req.headers.get("x-admin-migration-token")?.trim() || queryToken?.trim();

  if (suppliedToken) {
    if (!configuredToken) throw new Error("ADMIN_MIGRATION_TOKEN is not configured in this deployment.");
    if (suppliedToken !== configuredToken) throw new Error("Migration token was not accepted for this deployment.");
    return null;
  }

  return requireAdmin();
}

function payloadFromSearchParams(searchParams: URLSearchParams) {
  return requestSchema.parse({
    dryRun: searchParams.get("dryRun") !== "false",
    limit: Number(searchParams.get("limit") ?? 50),
    overwrite: searchParams.get("overwrite") === "true",
    source: searchParams.get("source") ?? "db",
  });
}

async function getDbCandidates(): Promise<SourceCandidate[]> {
  const artworks = await db.artwork.findMany({
    include: { collection: true, assets: true },
    orderBy: { updatedAt: "desc" },
  });

  return artworks
    .flatMap((artwork) => {
      const originals = artwork.assets.filter((asset) => asset.kind === "ORIGINAL" && isProcessableOriginal(asset.storageKey));
      return originals.map((asset) => ({
        artworkId: artwork.id,
        artworkSlug: artwork.slug,
        title: artwork.title,
        collectionSlug: artwork.collection?.slug ?? collectionSlugFromStorageKey(asset.storageKey),
        collectionName: artwork.collection?.name ?? undefined,
        originalStorageKey: asset.storageKey,
        pricePence: artwork.pricePence,
        currency: artwork.currency,
        status: artwork.status,
        category: artwork.category,
        updatedAt: artwork.updatedAt.toISOString(),
      }));
    });
}

async function getR2Candidates(): Promise<SourceCandidate[]> {
  const folders = await listTopLevelCollectionFolders();
  const candidates: SourceCandidate[] = [];

  for (const folder of folders) {
    const objects = await listCollectionObjects(folder).catch(() => []);
    for (const object of objects) {
      if (!isProcessableOriginal(object.key)) continue;
      candidates.push({
        title: titleFromStorageKey(object.key),
        collectionSlug: folder,
        collectionName: folder,
        originalStorageKey: object.key,
        pricePence: 0,
        currency: "GBP",
        status: "DRAFT",
        updatedAt: object.lastModified ?? new Date().toISOString(),
      });
    }
  }

  return candidates;
}

function dedupeCandidates(candidates: SourceCandidate[]) {
  const seen = new Set<string>();
  const output: SourceCandidate[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.originalStorageKey)) continue;
    seen.add(candidate.originalStorageKey);
    output.push(candidate);
  }
  return output;
}

async function runWatermarkJob(req: Request, payload: z.infer<typeof requestSchema>) {
  const admin = await requireMigrationAccess(req);
  const candidates = dedupeCandidates([
    ...(payload.source === "db" || payload.source === "both" ? await getDbCandidates() : []),
    ...(payload.source === "r2" || payload.source === "both" ? await getR2Candidates() : []),
  ]).slice(0, payload.limit);

  const generated: Array<{
    title: string;
    originalStorageKey: string;
    watermarkedStorageKey: string;
    previewUrl?: string;
    dryRun: boolean;
  }> = [];
  const skipped: Array<{ originalStorageKey: string; reason: string }> = [];
  const failed: Array<{ originalStorageKey: string; error: string }> = [];

  for (const candidate of candidates) {
    const watermarkedStorageKey = buildWatermarkedStorageKey(candidate.originalStorageKey);

    try {
      const existingWatermarked = candidate.artworkId
        ? await db.artworkAsset.findUnique({ where: { storageKey: watermarkedStorageKey } })
        : null;

      if (existingWatermarked && !payload.overwrite) {
        skipped.push({ originalStorageKey: candidate.originalStorageKey, reason: "Watermarked preview already exists." });
        continue;
      }

      if (payload.dryRun) {
        generated.push({
          title: candidate.title,
          originalStorageKey: candidate.originalStorageKey,
          watermarkedStorageKey,
          dryRun: true,
        });
        continue;
      }

      const original = await getObjectBuffer(candidate.originalStorageKey);
      const watermarked = await renderWatermarkedPreview(original.body, candidate.title, {
        targetWidth: 1600,
        quality: 82,
      });

      if (!watermarked) {
        throw new Error("Unable to render watermarked preview. Sharp may be unavailable in this runtime.");
      }

      await putObjectBuffer(watermarkedStorageKey, watermarked, "image/jpeg", {
        cacheControl: "public, max-age=31536000, immutable",
      });

      const previewUrl = getPublicObjectUrl(watermarkedStorageKey);

      if (candidate.artworkId) {
        await db.artworkAsset.upsert({
          where: { storageKey: watermarkedStorageKey },
          update: {
            artworkId: candidate.artworkId,
            kind: "WATERMARKED_PREVIEW",
            mimeType: "image/jpeg",
            bytes: watermarked.length,
            checksum: "one-off-r2-watermarked-preview",
          },
          create: {
            artworkId: candidate.artworkId,
            kind: "WATERMARKED_PREVIEW",
            storageKey: watermarkedStorageKey,
            mimeType: "image/jpeg",
            bytes: watermarked.length,
            checksum: "one-off-r2-watermarked-preview",
          },
        });

        const updatedArtwork = await db.artwork.update({
          where: { id: candidate.artworkId },
          data: { previewUrl },
          include: { collection: true },
        });

        await upsertCollectionManifestWork({
          folderName: candidate.collectionSlug,
          collectionName: candidate.collectionName,
          work: {
            id: updatedArtwork.id,
            slug: updatedArtwork.slug,
            title: updatedArtwork.title,
            year: String(new Date().getUTCFullYear()),
            category: updatedArtwork.category ?? undefined,
            pricePence: updatedArtwork.pricePence,
            currency: updatedArtwork.currency,
            storageKey: candidate.originalStorageKey,
            previewStorageKey: watermarkedStorageKey,
            publicImageUrl: previewUrl,
            status: updatedArtwork.status,
            updatedAt: updatedArtwork.updatedAt.toISOString(),
          },
        });
      }

      generated.push({
        title: candidate.title,
        originalStorageKey: candidate.originalStorageKey,
        watermarkedStorageKey,
        previewUrl,
        dryRun: false,
      });
    } catch (error) {
      failed.push({
        originalStorageKey: candidate.originalStorageKey,
        error: error instanceof Error ? error.message : "Watermark generation failed.",
      });
    }
  }

  if (!payload.dryRun && admin) {
    await writeAuditLog({
      userId: admin.id,
      action: "r2.watermarked-previews.generate",
      entityType: "ArtworkAsset",
      entityId: "bulk",
      metadata: {
        generated: generated.length,
        skipped: skipped.length,
        failed: failed.length,
        source: payload.source,
      },
    });
  }

  return {
    dryRun: payload.dryRun,
    source: payload.source,
    checked: candidates.length,
    generated,
    skipped,
    failed,
    outputFolderPattern: "collections/<collection>/watermarked/<filename>-watermarked.jpg",
    warning:
      "This generates app-owned R2 watermarked previews from files already present in Cloudflare R2. It does not recover originals that only exist in Sanity and are not already in R2.",
  };
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to generate watermarked previews.";
  const lowered = message.toLowerCase();
  const status = lowered.includes("admin access denied") || lowered.includes("migration token") ? 401 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const payload = payloadFromSearchParams(url.searchParams);
    return NextResponse.json(await runWatermarkJob(req, payload));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const payload = requestSchema.parse(await req.json().catch(() => ({})));
    return NextResponse.json(await runWatermarkJob(req, payload));
  } catch (error) {
    return errorResponse(error);
  }
}
