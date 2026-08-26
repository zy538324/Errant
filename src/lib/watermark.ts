import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings";

const PREVIEW_MAX_AGE_SECONDS = 5 * 60;
const PREVIEW_TARGET_WIDTH = 1600;
const PREVIEW_QUALITY = 82;
const STORAGE_PREVIEW_LABEL_LIMIT = 120;

type RenderWatermarkedPreviewOptions = {
  targetWidth?: number;
  quality?: number;
};

type StoragePreviewMode = "proxy" | "render";
type SharpModule = typeof import("sharp");
type WatermarkedImageFormat = "jpeg" | "webp";

let sharpPromise: Promise<SharpModule | null> | null = null;
let sharpUnavailableLogged = false;

function encodePreviewPayload(assetId: string, expiresAt: number) {
  return `${assetId}:${expiresAt}`;
}

function getBlobSigningSecret() {
  const secret =
    process.env.BLOB_SIGNING_SECRET?.trim() ||
    getAdminSettingsSnapshot().security.blobSigningSecret.trim();
  return secret || null;
}

function createPreviewSignature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSignedPreviewUrl(assetId: string) {
  const secret = getBlobSigningSecret();
  if (!secret) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + PREVIEW_MAX_AGE_SECONDS;
  const payload = encodePreviewPayload(assetId, expiresAt);
  const signature = createPreviewSignature(payload, secret);

  return `/api/images/${assetId}?expires=${expiresAt}&signature=${signature}`;
}

export function verifySignedPreviewUrl(
  assetId: string,
  expires: string,
  signature: string,
) {
  const expiresAt = Number.parseInt(expires, 10);
  const secret = getBlobSigningSecret();

  if (!secret || !Number.isFinite(expiresAt)) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  const payload = encodePreviewPayload(assetId, expiresAt);
  const expected = createPreviewSignature(payload, secret);
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (actualBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return false;
  }

  return {
    expiresAt,
  };
}

function sanitizePreviewLabel(title: string) {
  return title.trim().slice(0, STORAGE_PREVIEW_LABEL_LIMIT) || "Errant-Arts preview";
}

function sanitizePreviewMode(
  mode: string | null | undefined,
): StoragePreviewMode {
  return mode === "proxy" ? "proxy" : "render";
}

function getStoragePreviewPayload(
  encryptedStorageKey: string,
  mode: StoragePreviewMode,
  title: string,
  expiresAt: number,
) {
  return `${encryptedStorageKey}:${mode}:${title}:${expiresAt}`;
}

function getStorageEncryptionKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function encryptStorageKey(storageKey: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getStorageEncryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(storageKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

function decryptStorageKey(token: string, secret: string) {
  const raw = Buffer.from(token, "base64url");
  if (raw.length <= 28) throw new Error("Invalid storage preview token.");

  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getStorageEncryptionKey(secret),
    iv,
  );
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

export function createSignedStoragePreviewUrl(
  storageKey: string,
  title: string,
  options?: { mode?: StoragePreviewMode },
) {
  const secret = getBlobSigningSecret();
  if (!secret) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + PREVIEW_MAX_AGE_SECONDS;
  const encryptedStorageKey = encryptStorageKey(storageKey, secret);
  const mode = sanitizePreviewMode(options?.mode);
  const safeTitle = mode === "render" ? sanitizePreviewLabel(title) : "";
  const payload = getStoragePreviewPayload(
    encryptedStorageKey,
    mode,
    safeTitle,
    expiresAt,
  );
  const signature = createPreviewSignature(payload, secret);
  const params = new URLSearchParams({
    token: encryptedStorageKey,
    mode,
    expires: String(expiresAt),
    signature,
  });
  if (safeTitle) params.set("title", safeTitle);
  return `/api/images/storage?${params.toString()}`;
}

export function createSignedStorageProxyUrl(storageKey: string) {
  return createSignedStoragePreviewUrl(storageKey, "", { mode: "proxy" });
}

export function verifySignedStoragePreviewRequest(
  encryptedStorageKey: string,
  title: string,
  expires: string,
  signature: string,
  modeInput?: string | null,
) {
  const expiresAt = Number.parseInt(expires, 10);
  const secret = getBlobSigningSecret();
  const mode = sanitizePreviewMode(modeInput);
  const safeTitle = mode === "render" ? sanitizePreviewLabel(title) : "";

  if (!secret || !Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    throw new Error("Invalid or expired preview signature.");
  }

  const payload = getStoragePreviewPayload(
    encryptedStorageKey,
    mode,
    safeTitle,
    expiresAt,
  );
  const expected = createPreviewSignature(payload, secret);
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (actualBuffer.length !== expectedBuffer.length) {
    throw new Error("Invalid or expired preview signature.");
  }
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Invalid or expired preview signature.");
  }

  return {
    storageKey: decryptStorageKey(encryptedStorageKey, secret),
    title: safeTitle,
    mode,
    expiresAt,
  };
}

export function getPreviewCacheControl(expiresAt: number) {
  const ttl = Math.max(1, expiresAt - Math.floor(Date.now() / 1000));
  return `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=60`;
}

async function getSharp() {
  if (!sharpPromise) {
    sharpPromise = import("sharp")
      .then((module) => (module.default ?? module) as SharpModule)
      .catch((error) => {
        if (!sharpUnavailableLogged) {
          sharpUnavailableLogged = true;
          console.warn(
            "[watermark] Sharp is unavailable in this runtime. Falling back to non-watermarked image responses.",
            error,
          );
        }

        return null;
      });
  }

  return sharpPromise;
}

function buildWatermarkSvg(width: number, height: number, label: string) {
  const fontSize = Math.max(20, Math.round(width / 28));
  const tileWidth = Math.max(320, Math.round(width / 2.8));
  const tileHeight = Math.max(180, Math.round(height / 3.2));
  const safeLabel = label.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <pattern id="wm" width="${tileWidth}" height="${tileHeight}" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
          <text x="30" y="${Math.round(tileHeight / 2)}" fill="rgba(255,255,255,0.22)" font-family="Georgia, serif" font-size="${fontSize}" letter-spacing="6">${safeLabel}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)" />
      <rect x="24" y="${Math.max(24, height - 84)}" rx="28" ry="28" width="${Math.max(48, Math.min(width - 48, 420))}" height="56" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.25)" />
      <text x="52" y="${Math.max(52, height - 48)}" fill="white" font-family="Georgia, serif" font-size="20" letter-spacing="4">${safeLabel}</text>
    </svg>`;
}

async function renderWatermarkedImage(
  input: Buffer,
  label: string,
  options: RenderWatermarkedPreviewOptions & { format: WatermarkedImageFormat },
) {
  const sharp = await getSharp();

  if (!sharp) {
    return null;
  }

  const targetWidth = Math.max(
    480,
    Math.round(options.targetWidth ?? PREVIEW_TARGET_WIDTH),
  );
  const quality = Math.max(
    45,
    Math.min(90, Math.round(options.quality ?? PREVIEW_QUALITY)),
  );
  const safeLabel = sanitizePreviewLabel(label);
  const resized = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: targetWidth, withoutEnlargement: true })
    .toBuffer();
  const resizedMetadata = await sharp(resized, { failOn: "none" }).metadata();
  const width = Math.max(1, resizedMetadata.width ?? targetWidth);
  const height = Math.max(1, resizedMetadata.height ?? Math.round(width * 1.25));
  const overlay = Buffer.from(buildWatermarkSvg(width, height, safeLabel));
  const pipeline = sharp(resized, { failOn: "none" })
    .composite([{ input: overlay, top: 0, left: 0, blend: "over" }]);

  return options.format === "webp"
    ? pipeline.webp({ quality }).toBuffer()
    : pipeline.jpeg({ quality }).toBuffer();
}

export async function renderWatermarkedPreview(
  input: Buffer,
  title: string,
  options: RenderWatermarkedPreviewOptions = {},
) {
  const watermarkLabel = getAdminSettingsSnapshot().operations.watermarkLabel;
  const label = `${watermarkLabel} - ${title}`;

  return renderWatermarkedImage(input, label, {
    ...options,
    format: "jpeg",
  });
}

export async function renderProtectedHostedPreview(
  input: Buffer,
  title: string,
  options: RenderWatermarkedPreviewOptions = {},
) {
  return renderWatermarkedImage(input, title, {
    ...options,
    format: "webp",
  });
}
