import { db } from "@/lib/db";
import {
  getPublicObjectUrl,
  getObjectBuffer,
  getObjectText,
  listCollectionObjects,
  listTopLevelCollectionFolders,
  normalizeCollectionSlug,
  putObjectBuffer,
  putObjectJson,
  resolveCollectionFolderName,
} from "@/lib/storage";
import {
  createSignedStoragePreviewUrl,
  createSignedStorageProxyUrl,
  renderWatermarkedPreview,
} from "@/lib/watermark";
import { createPublicHostedImageUrl, isAllowedImageUrl } from "@/lib/protected-images";

const MANIFEST_VERSION = 2;
const MANIFEST_FILENAME = "manifest.json";
const THUMBNAIL_FOLDER = "thumbs";
const THUMBNAIL_WIDTH = 1400;
const THUMBNAIL_QUALITY = 78;
const THUMBNAIL_CACHE_CONTROL = "public, max-age=31536000, immutable";

export type ManifestWork = {
  id: string;
  slug: string;
  title: string;
  year?: string;
  category?: string;
  pricePence: number;
  currency: string;
  image: string;
  storageKey: string;
  previewStorageKey?: string | null;
  publicImageUrl?: string | null;
  status: string;
  updatedAt: string;
};

export type CollectionManifest = {
  title: string;
  slug: string;
  folderName: string;
  updatedAt: string;
  works: ManifestWork[];
};

type StoredManifestWork = Omit<ManifestWork, "image"> & { image?: string };

type StoredCollectionManifest = {
  version?: number;
  title: string;
  slug: string;
  folderName?: string;
  updatedAt: string;
  works: StoredManifestWork[];
};

type SyncCollectionManifestOptions = { overwriteExistingPreviews?: boolean };

type EnsureWatermarkedCollectionThumbnailInput = {
  storageKey: string;
  title: string;
  folderName?: string;
  overwrite?: boolean;
  existingPreviewStorageKey?: string | null;
};

type EnsureWatermarkedCollectionThumbnailResult = {
  storageKey: string;
  mimeType: string;
  bytes: number;
};

type UpsertCollectionManifestWorkInput = {
  folderName: string;
  collectionName?: string;
  work: Omit<StoredManifestWork, "image"> & { image?: string | null };
};

type DbCollectionRecord = { name: string; slug: string; artworks: DbArtworkRecord[] };

type DbArtworkRecord = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  pricePence: number;
  currency: string;
  status: string;
  updatedAt: Date;
  assets: Array<{ storageKey: string; kind: string }>;
};

function buildManifestKey(folderName: string) { return `collections/${folderName}/${MANIFEST_FILENAME}`; }
function getFileNameFromKey(storageKey: string) { return storageKey.split("/").pop() ?? storageKey; }
function stripExtension(filename: string) { return filename.replace(/\.[^.]+$/, ""); }
function stripThumbnailSuffix(filename: string) { return filename.replace(/-thumb$/i, ""); }
function toTitleCase(value: string) { return value.replace(/\b([a-z])/g, (match) => match.toUpperCase()); }

function prettifyCollectionTitle(folderName: string) {
  const label = folderName.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return label ? toTitleCase(label) : "Collection";
}

function prettifyWorkTitle(storageKey: string) {
  const label = stripThumbnailSuffix(stripExtension(getFileNameFromKey(storageKey))).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return label ? toTitleCase(label) : "Untitled Work";
}

function slugifyWork(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180) || "work";
}

function extractCollectionFolderName(storageKey: string) { return storageKey.match(/^collections\/([^/]+)\//)?.[1] ?? null; }

function getRelativeKeyPath(storageKey: string) {
  const folderName = extractCollectionFolderName(storageKey);
  return folderName ? storageKey.slice(`collections/${folderName}/`.length) : null;
}

function isManifestKey(storageKey: string) { return /\/manifest\.json$/i.test(storageKey); }
function isImageKey(storageKey: string) { return /\.(jpe?g|png|webp|avif|tif|tiff)$/i.test(storageKey); }

function isThumbnailKey(storageKey: string) {
  const relativePath = getRelativeKeyPath(storageKey);
  return Boolean(relativePath && relativePath.startsWith(`${THUMBNAIL_FOLDER}/`) && isImageKey(storageKey));
}

function isOriginalCandidateKey(storageKey: string) {
  const relativePath = getRelativeKeyPath(storageKey);
  if (!relativePath || !isImageKey(storageKey) || isManifestKey(storageKey) || isThumbnailKey(storageKey)) return false;
  return !relativePath.startsWith(`${THUMBNAIL_FOLDER}/`);
}

function buildThumbnailKey(folderName: string, originalStorageKey: string) {
  const fileBase = stripThumbnailSuffix(stripExtension(getFileNameFromKey(originalStorageKey)));
  return `collections/${folderName}/${THUMBNAIL_FOLDER}/${fileBase}-thumb.jpg`;
}

function makeUniqueSlug(baseSlug: string, usedSlugs: Set<string>) {
  const rootSlug = baseSlug || "work";
  let candidate = rootSlug;
  let suffix = 2;
  while (usedSlugs.has(candidate)) candidate = `${rootSlug}-${suffix++}`;
  usedSlugs.add(candidate);
  return candidate;
}

function sortWorks<T extends { updatedAt: string }>(works: T[]) {
  return [...works].sort((left, right) => (Date.parse(right.updatedAt) || 0) - (Date.parse(left.updatedAt) || 0));
}

function createProtectedHostedPreviewUrl(rawUrl: string) {
  if (!isAllowedImageUrl(rawUrl)) return null;
  try { return createPublicHostedImageUrl(rawUrl, { width: THUMBNAIL_WIDTH, quality: THUMBNAIL_QUALITY }); } catch { return null; }
}

function isExternalPreviewUrl(value: string | null | undefined) {
  if (!value) return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function toPreviewUrl(work: StoredManifestWork) {
  if (work.previewStorageKey && isThumbnailKey(work.previewStorageKey)) {
    try { return getPublicObjectUrl(work.previewStorageKey); } catch { return createSignedStorageProxyUrl(work.previewStorageKey) || "/logo.png"; }
  }
  if (work.previewStorageKey) return createSignedStorageProxyUrl(work.previewStorageKey) || "/logo.png";
  if (isThumbnailKey(work.storageKey)) {
    try { return getPublicObjectUrl(work.storageKey); } catch { return createSignedStorageProxyUrl(work.storageKey) || "/logo.png"; }
  }
  const renderedPreviewUrl = createSignedStoragePreviewUrl(work.storageKey, work.title);
  if (renderedPreviewUrl) return renderedPreviewUrl;
  if (isExternalPreviewUrl(work.publicImageUrl)) return createProtectedHostedPreviewUrl(work.publicImageUrl!) || "/logo.png";
  const legacyImage = work.image?.trim();
  if (legacyImage?.startsWith("/")) return legacyImage;
  if (legacyImage && isExternalPreviewUrl(legacyImage)) return createProtectedHostedPreviewUrl(legacyImage) || "/logo.png";
  return "/logo.png";
}

function hydrateManifestWork(work: StoredManifestWork): ManifestWork {
  const image = toPreviewUrl(work);
  return {
    id: work.id,
    slug: work.slug,
    title: work.title,
    year: work.year,
    category: work.category,
    pricePence: work.pricePence,
    currency: work.currency,
    image,
    storageKey: work.storageKey,
    previewStorageKey: work.previewStorageKey ?? null,
    publicImageUrl: image === "/logo.png" ? null : image,
    status: work.status,
    updatedAt: work.updatedAt,
  };
}

function toPublicCollectionManifest(storedManifest: StoredCollectionManifest, options: { publishedOnly?: boolean } = {}): CollectionManifest {
  const publishedOnly = options.publishedOnly ?? true;
  const works = sortWorks(storedManifest.works.filter((work) => !publishedOnly || work.status === "PUBLISHED").map(hydrateManifestWork));
  return {
    title: storedManifest.title,
    slug: storedManifest.slug,
    folderName: storedManifest.folderName ?? storedManifest.slug,
    updatedAt: storedManifest.updatedAt,
    works,
  };
}

async function loadStoredManifest(folderName: string) {
  try {
    const raw = await getObjectText(buildManifestKey(folderName));
    const parsed = JSON.parse(raw) as StoredCollectionManifest;
    if (!parsed || !Array.isArray(parsed.works)) return null;
    return {
      ...parsed,
      folderName: parsed.folderName ?? folderName,
      slug: parsed.slug || normalizeCollectionSlug(folderName),
      title: parsed.title || prettifyCollectionTitle(folderName),
    } satisfies StoredCollectionManifest;
  } catch {
    return null;
  }
}

async function getDbCollectionRecord(folderName: string) {
  const collectionSlug = normalizeCollectionSlug(folderName);
  try {
    return (await db.collection.findFirst({
      where: { slug: collectionSlug },
      include: { artworks: { include: { assets: true }, orderBy: { createdAt: "desc" } } },
    })) as DbCollectionRecord | null;
  } catch {
    return null;
  }
}

function buildArtworkIndexes(collection: DbCollectionRecord | null) {
  const byStorageKey = new Map<string, DbArtworkRecord>();
  const bySlug = new Map<string, DbArtworkRecord>();
  for (const artwork of collection?.artworks ?? []) {
    bySlug.set(artwork.slug, artwork);
    for (const asset of artwork.assets) byStorageKey.set(asset.storageKey, artwork);
  }
  return { byStorageKey, bySlug };
}

export async function ensureWatermarkedCollectionThumbnail({ storageKey, title, folderName, overwrite = false, existingPreviewStorageKey }: EnsureWatermarkedCollectionThumbnailInput): Promise<EnsureWatermarkedCollectionThumbnailResult> {
  const resolvedFolder = extractCollectionFolderName(storageKey) ?? (folderName ? (await resolveCollectionFolderName(folderName)) ?? normalizeCollectionSlug(folderName) : null);
  if (!resolvedFolder) throw new Error("Unable to resolve the collection folder for thumbnail generation.");
  const previewStorageKey = existingPreviewStorageKey?.trim() || buildThumbnailKey(resolvedFolder, storageKey);
  if (!overwrite && existingPreviewStorageKey?.trim()) return { storageKey: previewStorageKey, mimeType: "image/jpeg", bytes: 0 };
  const original = await getObjectBuffer(storageKey);
  const preview = await renderWatermarkedPreview(original.body, title, { targetWidth: THUMBNAIL_WIDTH, quality: THUMBNAIL_QUALITY });
  if (!preview) return { storageKey, mimeType: original.contentType, bytes: original.body.length };
  await putObjectBuffer(previewStorageKey, preview, "image/jpeg", { cacheControl: THUMBNAIL_CACHE_CONTROL });
  return { storageKey: previewStorageKey, mimeType: "image/jpeg", bytes: preview.length };
}

export async function syncCollectionManifest(folderName: string, options: SyncCollectionManifestOptions = {}) {
  const normalizedSlug = normalizeCollectionSlug(folderName);
  if (!normalizedSlug) throw new Error("A collection slug is required to build the manifest.");
  const resolvedFolder = (await resolveCollectionFolderName(folderName)) ?? normalizedSlug;
  const existingManifest = await loadStoredManifest(resolvedFolder);
  const objects = await listCollectionObjects(resolvedFolder);
  const collection = await getDbCollectionRecord(resolvedFolder);
  const { byStorageKey, bySlug } = buildArtworkIndexes(collection);
  const thumbnailKeys = new Set(objects.filter((object) => isThumbnailKey(object.key)).map((object) => object.key));
  const existingWorks = new Map((existingManifest?.works ?? []).map((work) => [work.storageKey, work] as const));
  const usedSlugs = new Set<string>();
  const works: StoredManifestWork[] = [];
  const now = new Date().toISOString();
  const originalObjects = objects.filter((object) => isOriginalCandidateKey(object.key)).sort((left, right) => (Date.parse(right.lastModified ?? "") || 0) - (Date.parse(left.lastModified ?? "") || 0));

  for (const object of originalObjects) {
    const preserved = existingWorks.get(object.key);
    const dbArtwork = byStorageKey.get(object.key) ?? (preserved?.slug ? bySlug.get(preserved.slug) : undefined) ?? null;
    const expectedPreviewKey = buildThumbnailKey(resolvedFolder, object.key);
    const existingPreviewStorageKey = (preserved?.previewStorageKey && thumbnailKeys.has(preserved.previewStorageKey) ? preserved.previewStorageKey : null) ?? (thumbnailKeys.has(expectedPreviewKey) ? expectedPreviewKey : null);
    const title = preserved?.title?.trim() || dbArtwork?.title || prettifyWorkTitle(object.key);
    const preview = await ensureWatermarkedCollectionThumbnail({ storageKey: object.key, title, folderName: resolvedFolder, overwrite: options.overwriteExistingPreviews ?? false, existingPreviewStorageKey });
    const baseSlug = preserved?.slug || dbArtwork?.slug || slugifyWork(stripThumbnailSuffix(stripExtension(getFileNameFromKey(object.key))));
    const slug = makeUniqueSlug(baseSlug, usedSlugs);
    works.push({
      id: preserved?.id ?? dbArtwork?.id ?? `manifest:${normalizedSlug}:${slug}`,
      slug,
      title,
      year: preserved?.year,
      category: preserved?.category ?? dbArtwork?.category ?? undefined,
      pricePence: preserved?.pricePence ?? dbArtwork?.pricePence ?? 0,
      currency: preserved?.currency ?? dbArtwork?.currency ?? "GBP",
      storageKey: object.key,
      previewStorageKey: preview.storageKey,
      publicImageUrl: preserved?.publicImageUrl ?? null,
      image: undefined,
      status: preserved?.status ?? dbArtwork?.status ?? "PUBLISHED",
      updatedAt: preserved?.updatedAt ?? dbArtwork?.updatedAt?.toISOString() ?? object.lastModified ?? now,
    });
  }

  if (works.length === 0) {
    for (const object of objects.filter((object) => isThumbnailKey(object.key))) {
      const preserved = existingWorks.get(object.key);
      const baseSlug = preserved?.slug || slugifyWork(stripThumbnailSuffix(stripExtension(getFileNameFromKey(object.key))));
      const slug = makeUniqueSlug(baseSlug, usedSlugs);
      works.push({
        id: preserved?.id ?? `manifest:${normalizedSlug}:${slug}`,
        slug,
        title: preserved?.title ?? prettifyWorkTitle(object.key),
        year: preserved?.year,
        category: preserved?.category,
        pricePence: preserved?.pricePence ?? 0,
        currency: preserved?.currency ?? "GBP",
        storageKey: object.key,
        previewStorageKey: object.key,
        publicImageUrl: preserved?.publicImageUrl ?? null,
        image: undefined,
        status: preserved?.status ?? "PUBLISHED",
        updatedAt: preserved?.updatedAt ?? object.lastModified ?? now,
      });
    }
  }

  const manifest: StoredCollectionManifest = {
    version: MANIFEST_VERSION,
    title: collection?.name ?? existingManifest?.title ?? prettifyCollectionTitle(resolvedFolder),
    slug: collection?.slug ?? existingManifest?.slug ?? normalizedSlug,
    folderName: resolvedFolder,
    updatedAt: now,
    works: sortWorks(works),
  };
  await putObjectJson(buildManifestKey(resolvedFolder), manifest);
  return toPublicCollectionManifest(manifest, { publishedOnly: false });
}

export async function upsertCollectionManifestWork({ folderName, collectionName, work }: UpsertCollectionManifestWorkInput) {
  const normalizedSlug = normalizeCollectionSlug(folderName);
  if (!normalizedSlug) throw new Error("A collection slug is required to update the manifest.");
  const resolvedFolder = (await resolveCollectionFolderName(folderName)) ?? normalizedSlug;
  const existingManifest = (await loadStoredManifest(resolvedFolder)) ?? { version: MANIFEST_VERSION, title: collectionName?.trim() || prettifyCollectionTitle(resolvedFolder), slug: normalizedSlug, folderName: resolvedFolder, updatedAt: new Date().toISOString(), works: [] };
  const previewStorageKey = work.previewStorageKey?.trim() || null;
  const mergedWork: StoredManifestWork = { id: work.id, slug: work.slug, title: work.title, year: work.year, category: work.category, pricePence: work.pricePence, currency: work.currency, storageKey: work.storageKey, previewStorageKey, publicImageUrl: work.publicImageUrl?.trim() || null, image: undefined, status: work.status, updatedAt: work.updatedAt };
  const nextWorks = [...existingManifest.works];
  const existingIndex = nextWorks.findIndex((entry) => entry.id === mergedWork.id || entry.slug === mergedWork.slug || entry.storageKey === mergedWork.storageKey);
  if (existingIndex >= 0) nextWorks[existingIndex] = { ...nextWorks[existingIndex], ...mergedWork, publicImageUrl: mergedWork.publicImageUrl, image: mergedWork.image, updatedAt: mergedWork.updatedAt };
  else nextWorks.push(mergedWork);
  const manifest: StoredCollectionManifest = { version: MANIFEST_VERSION, title: collectionName?.trim() || existingManifest.title, slug: existingManifest.slug || normalizedSlug, folderName: resolvedFolder, updatedAt: new Date().toISOString(), works: sortWorks(nextWorks) };
  await putObjectJson(buildManifestKey(resolvedFolder), manifest);
  return toPublicCollectionManifest(manifest, { publishedOnly: false });
}

export async function listCollectionFolders() { return listTopLevelCollectionFolders(); }

export async function getCollectionManifest(folderName: string) {
  const normalizedSlug = normalizeCollectionSlug(folderName);
  if (!normalizedSlug) return null;
  const resolvedFolder = (await resolveCollectionFolderName(folderName)) ?? normalizedSlug;
  const existingManifest = await loadStoredManifest(resolvedFolder);
  const needsRefresh = !existingManifest || existingManifest.version !== MANIFEST_VERSION || existingManifest.folderName !== resolvedFolder || existingManifest.works.some((work) => !work.previewStorageKey && !isThumbnailKey(work.storageKey));
  const manifest = needsRefresh ? null : toPublicCollectionManifest(existingManifest);
  if (manifest) return manifest.works.length > 0 ? manifest : null;
  const syncedManifest = await syncCollectionManifest(resolvedFolder);
  const publishedManifest: CollectionManifest = { ...syncedManifest, works: syncedManifest.works.filter((work) => work.status === "PUBLISHED") };
  return publishedManifest.works.length > 0 ? publishedManifest : null;
}

export async function listManifestWorks(limit?: number) {
  const folders = await listCollectionFolders();
  const works: ManifestWork[] = [];
  for (const folder of folders) {
    const manifest = await getCollectionManifest(folder).catch(() => null);
    if (manifest) works.push(...manifest.works);
  }
  const sorted = sortWorks(works);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function findManifestWorkBySlug(slug: string) {
  if (!slug.trim()) return null;
  const folders = await listCollectionFolders();
  for (const folder of folders) {
    const manifest = await getCollectionManifest(folder).catch(() => null);
    const match = manifest?.works.find((work) => work.slug === slug) ?? null;
    if (match) return match;
  }
  return null;
}

export async function getMostRecentPublishedCollectionManifest() {
  const folders = await listCollectionFolders();
  let latestManifest: CollectionManifest | null = null;
  let latestTimestamp = -Infinity;
  for (const folder of folders) {
    const manifest = await getCollectionManifest(folder).catch(() => null);
    if (!manifest?.works.length) continue;
    const manifestTimestamp = Math.max(...manifest.works.map((work) => Date.parse(work.updatedAt) || 0));
    if (manifestTimestamp > latestTimestamp) {
      latestTimestamp = manifestTimestamp;
      latestManifest = manifest;
    }
  }
  return latestManifest;
}
