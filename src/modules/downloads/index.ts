import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { findManifestWorkBySlug } from "@/lib/r2-collections";

const DOWNLOAD_GRANT_SECONDS = 2 * 60;

type DownloadDelivery = {
  storageKey: string;
  filename: string;
  mimeType: string;
  downloadCount: number;
  maxDownloads: number;
  remainingDownloads: number;
};

type DownloadLookupOptions = {
  incrementCount?: boolean;
};

function getDownloadSigningSecret() {
  const secret = process.env.BLOB_SIGNING_SECRET?.trim();
  if (!secret) {
    throw new Error("Download signing is not configured.");
  }
  return secret;
}

function createDownloadGrantSignature(input: {
  entitlementId: string;
  customerId: string;
  expiresAt: number;
}) {
  return createHmac("sha256", getDownloadSigningSecret())
    .update(`${input.entitlementId}:${input.customerId}:${input.expiresAt}`)
    .digest("hex");
}

export function createDownloadGrantUrl(entitlementId: string, customerId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + DOWNLOAD_GRANT_SECONDS;
  const signature = createDownloadGrantSignature({
    entitlementId,
    customerId,
    expiresAt,
  });
  const params = new URLSearchParams({
    expires: String(expiresAt),
    signature,
  });
  return `/api/downloads/${encodeURIComponent(entitlementId)}/file?${params.toString()}`;
}

export function verifyDownloadGrant(input: {
  entitlementId: string;
  customerId: string;
  expires: string | null;
  signature: string | null;
}) {
  const expiresAt = Number.parseInt(input.expires ?? "", 10);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    throw new Error("Download link expired. Please request the download again.");
  }
  if (!input.signature || !/^[a-f0-9]{64}$/i.test(input.signature)) {
    throw new Error("Invalid download link.");
  }

  const expected = createDownloadGrantSignature({
    entitlementId: input.entitlementId,
    customerId: input.customerId,
    expiresAt,
  });
  const actualBuffer = Buffer.from(input.signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Invalid download link.");
  }
}

function extensionFromMimeType(mimeType: string | null | undefined) {
  const clean = mimeType?.split(";")[0]?.trim().toLowerCase();
  if (clean === "image/png") return "png";
  if (clean === "image/webp") return "webp";
  if (clean === "image/avif") return "avif";
  if (clean === "image/tiff") return "tif";
  if (clean === "application/zip") return "zip";
  return "jpg";
}

function safeDownloadFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180) || "errant-arts-download"
  );
}

function filenameFromStorageKey(storageKey: string) {
  return storageKey.split("/").filter(Boolean).pop() ?? "errant-arts-download.jpg";
}

function resolveDownloadFilename(input: {
  title: string;
  storageKey: string;
  mimeType: string | null;
  checksum?: string | null;
}) {
  const checksumFilename = input.checksum?.trim();
  if (checksumFilename && /\.[a-z0-9]{2,5}$/i.test(checksumFilename)) {
    return safeDownloadFilename(checksumFilename);
  }

  const storageFilename = filenameFromStorageKey(input.storageKey);
  const extension = storageFilename.includes(".")
    ? storageFilename.split(".").pop()!
    : extensionFromMimeType(input.mimeType);

  return `${safeDownloadFilename(input.title)}.${extension}`;
}

export async function getEntitlementDownloadDelivery(
  entitlementId: string,
  customerId: string,
  options: DownloadLookupOptions = {},
): Promise<DownloadDelivery> {
  const entitlement = await db.downloadEntitlement.findUnique({
    where: { id: entitlementId },
    include: {
      artwork: { include: { assets: true } },
    },
  });

  if (!entitlement || entitlement.customerId !== customerId) {
    throw new Error("Forbidden.");
  }

  if (entitlement.downloadCount >= entitlement.maxDownloads) {
    throw new Error("Download limit reached.");
  }

  const asset =
    entitlement.artwork.assets.find(
      (item: (typeof entitlement.artwork.assets)[number]) => item.kind === "DOWNLOAD_MASTER",
    ) ??
    entitlement.artwork.assets.find(
      (item: (typeof entitlement.artwork.assets)[number]) => item.kind === "ORIGINAL",
    );
  const manifestWork = asset
    ? null
    : await findManifestWorkBySlug(entitlement.artwork.slug).catch(() => null);

  const storageKey = asset?.storageKey ?? manifestWork?.storageKey;
  if (!storageKey) {
    throw new Error("File unavailable.");
  }

  const mimeType = asset?.mimeType || "application/octet-stream";

  let downloadCount = entitlement.downloadCount;
  if (options.incrementCount) {
    const updatedEntitlement = await db.downloadEntitlement.update({
      where: { id: entitlement.id },
      data: { downloadCount: { increment: 1 } },
      select: { downloadCount: true },
    });
    downloadCount = updatedEntitlement.downloadCount;
  }

  return {
    storageKey,
    mimeType,
    filename: resolveDownloadFilename({
      title: entitlement.artwork.title,
      storageKey,
      mimeType,
      checksum: asset?.checksum,
    }),
    downloadCount,
    maxDownloads: entitlement.maxDownloads,
    remainingDownloads: Math.max(0, entitlement.maxDownloads - downloadCount),
  };
}

export async function issueDownload(entitlementId: string, customerId: string) {
  const delivery = await getEntitlementDownloadDelivery(entitlementId, customerId, {
    incrementCount: false,
  });
  return {
    url: createDownloadGrantUrl(entitlementId, customerId),
    downloadCount: delivery.downloadCount,
    maxDownloads: delivery.maxDownloads,
    remainingDownloads: delivery.remainingDownloads,
  };
}
