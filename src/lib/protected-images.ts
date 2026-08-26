import { createHmac, timingSafeEqual } from 'node:crypto';
import { getAdminSettingsSnapshot } from '@/lib/admin-settings';

const DEFAULT_ALLOWED_HOSTS = ['cdn.sanity.io', 'images.unsplash.com'];
const DEFAULT_MAX_AGE_SECONDS = 60 * 10;
const DEFAULT_PUBLIC_IMAGE_WIDTH = 1600;
const DEFAULT_PUBLIC_IMAGE_QUALITY = 82;

function getSecret() {
  const secret =
    process.env.IMAGE_PROXY_SECRET?.trim() ||
    getAdminSettingsSnapshot().security.blobSigningSecret.trim();
  if (!secret) {
    throw new Error('Image proxy secret is not configured.');
  }

  return secret;
}

function encode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function createPayload(rawUrl: string, width: number, label: string, expiresAt: number) {
  return `${rawUrl}|${width}|${label}|${expiresAt}`;
}

function createSignature(payload: string) {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function clampPublicImageWidth(value: number | undefined) {
  return Math.max(320, Math.min(value ?? DEFAULT_PUBLIC_IMAGE_WIDTH, 2400));
}

function clampPublicImageQuality(value: number | undefined) {
  return Math.max(50, Math.min(value ?? DEFAULT_PUBLIC_IMAGE_QUALITY, 90));
}

function getConfiguredR2PublicHost() {
  try {
    const publicBaseUrl = getAdminSettingsSnapshot().storage.r2PublicBaseUrl.trim();
    return publicBaseUrl ? new URL(publicBaseUrl).hostname : null;
  } catch {
    return null;
  }
}

function getAllowedImageHosts() {
  return Array.from(new Set([
    ...DEFAULT_ALLOWED_HOSTS,
    getConfiguredR2PublicHost(),
    ...String(process.env.IMAGE_PROXY_ALLOWED_HOSTS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  ].filter((value): value is string => Boolean(value))));
}

export function createProtectedImageUrl(rawUrl: string, options?: { width?: number; label?: string; expiresInSeconds?: number }) {
  const width = Math.max(320, Math.min(options?.width ?? 1400, 2000));
  const label = (options?.label ?? 'Errant-Arts Preview').trim() || 'Errant-Arts Preview';
  const expiresAt = Math.floor(Date.now() / 1000) + (options?.expiresInSeconds ?? DEFAULT_MAX_AGE_SECONDS);
  const payload = createPayload(rawUrl, width, label, expiresAt);
  const signature = createSignature(payload);
  const params = new URLSearchParams({
    src: encode(rawUrl),
    w: String(width),
    label: encode(label),
    exp: String(expiresAt),
    sig: signature,
  });

  return `/api/protected-image?${params.toString()}`;
}

export function createPublicHostedImageUrl(
  rawUrl: string,
  options?: { width?: number; quality?: number },
) {
  if (!isAllowedImageUrl(rawUrl)) {
    return null;
  }

  const width = clampPublicImageWidth(options?.width);
  const quality = clampPublicImageQuality(options?.quality);
  const url = new URL(rawUrl);

  switch (url.hostname) {
    case 'cdn.sanity.io':
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'max');
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', String(quality));
      break;
    case 'images.unsplash.com':
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'max');
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', String(quality));
      break;
    default:
      break;
  }

  return url.toString();
}

export function verifyProtectedImageRequest(input: {
  encodedSource: string;
  width: string | null;
  encodedLabel: string;
  expiresAt: string | null;
  signature: string | null;
}) {
  if (!input.width || !input.expiresAt || !input.signature) {
    throw new Error('Missing required signature parameters.');
  }

  const rawUrl = decode(input.encodedSource);
  const label = decode(input.encodedLabel);
  const width = Number(input.width);
  const expiresAt = Number(input.expiresAt);

  if (!Number.isFinite(width) || width < 320 || width > 2000) {
    throw new Error('Invalid width.');
  }

  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    throw new Error('Image token expired.');
  }

  const payload = createPayload(rawUrl, width, label, expiresAt);
  const expectedSignature = Buffer.from(createSignature(payload));
  const actualSignature = Buffer.from(input.signature);

  if (expectedSignature.length !== actualSignature.length || !timingSafeEqual(expectedSignature, actualSignature)) {
    throw new Error('Invalid image signature.');
  }

  return { rawUrl, label, width, expiresAt };
}

export function isAllowedImageUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);
  return parsed.protocol === 'https:' && getAllowedImageHosts().includes(parsed.hostname);
}
