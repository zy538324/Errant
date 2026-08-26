import { randomUUID } from "node:crypto";
import { AwsClient } from "aws4fetch";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings";

type R2Config = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
};

type SignedR2UrlOptions = {
  method: "GET" | "PUT" | "DELETE";
  storageKey?: string;
  expiresInSeconds: number;
  headers?: HeadersInit;
  query?: Array<[string, string]>;
};

let browserUploadCorsCacheKey: string | null = null;

type SignedR2FetchOptions = {
  method: "GET" | "PUT" | "DELETE";
  storageKey?: string;
  headers?: HeadersInit;
  query?: Array<[string, string]>;
  body?: BodyInit;
};

type ParsedListObjectsResult = {
  commonPrefixes: string[];
  contents: R2ObjectInfo[];
  isTruncated: boolean;
  nextContinuationToken?: string;
};

export type R2ObjectInfo = {
  key: string;
  size: number;
  lastModified: string | null;
};

export function normalizeCollectionSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getR2Config(): R2Config {
  const settings = getAdminSettingsSnapshot();
  const { storage } = settings;
  const endpoint = storage.r2Endpoint.trim().replace(/\/+$/, "");
  const bucket = storage.r2Bucket.trim();

  if (!endpoint) throw new Error("Cloudflare R2 endpoint is not configured. Update it in admin settings.");
  if (!bucket) throw new Error("Cloudflare R2 bucket is not configured. Update it in admin settings.");
  if (!storage.r2AccessKeyId || !storage.r2SecretAccessKey) throw new Error("Cloudflare R2 keys are not configured. Update them in admin settings.");

  return { endpoint, bucket, accessKeyId: storage.r2AccessKeyId, secretAccessKey: storage.r2SecretAccessKey, publicBaseUrl: storage.r2PublicBaseUrl.trim().replace(/\/+$/, "") };
}

function getR2Client(config: R2Config) {
  return new AwsClient({ accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey, service: "s3", region: "auto", retries: 0 });
}

function splitPathSegments(value: string) { return value.split("/").filter(Boolean); }
function encodeRfc3986(value: string) { return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`); }

function buildR2Url(config: R2Config, storageKey?: string) {
  const endpoint = new URL(config.endpoint);
  const pathname = [...splitPathSegments(endpoint.pathname), config.bucket, ...splitPathSegments(storageKey ?? "")].map(encodeRfc3986).join("/");
  return new URL(`${endpoint.origin}/${pathname}`);
}

function withQuery(url: URL, query: Array<[string, string]> = []) {
  const nextUrl = new URL(url);
  for (const [key, value] of query) nextUrl.searchParams.append(key, value);
  return nextUrl;
}

function normalizeRequestHeaders(headers: HeadersInit | undefined) { return Object.fromEntries(new Headers(headers)); }

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}

function buildCorsConfigurationXml(origins: string[]) {
  const allowedOrigins = origins.map((origin) => `    <AllowedOrigin>${escapeXml(origin)}</AllowedOrigin>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
${allowedOrigins}
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>`;
}

async function createSignedR2Url(options: SignedR2UrlOptions) {
  const config = getR2Config();
  const client = getR2Client(config);
  const expiresInSeconds = Math.floor(options.expiresInSeconds);
  if (expiresInSeconds < 1 || expiresInSeconds > 604800) throw new Error("Cloudflare R2 signed URLs must expire between 1 second and 7 days.");
  const url = withQuery(buildR2Url(config, options.storageKey), [...(options.query ?? []), ["X-Amz-Expires", String(expiresInSeconds)]]);
  const request = await client.sign(url.toString(), { method: options.method, headers: options.headers, aws: { signQuery: true } });
  return { url: request.url, headers: normalizeRequestHeaders(options.headers) };
}

function decodeXmlEntities(value: string) { return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '\"').replace(/&#39;/g, "'").replace(/&amp;/g, "&"); }
function extractXmlSections(xml: string, tagName: string) { return Array.from(xml.matchAll(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "g")), (match) => match[1]); }
function extractXmlValue(xml: string, tagName: string) { const section = extractXmlSections(xml, tagName)[0]; return section ? decodeXmlEntities(section.trim()) : null; }

function parseListObjectsResult(xml: string): ParsedListObjectsResult {
  const commonPrefixes = extractXmlSections(xml, "CommonPrefixes").map((section) => extractXmlValue(section, "Prefix")).filter((value): value is string => Boolean(value));
  const contents = extractXmlSections(xml, "Contents").map((section) => {
    const key = extractXmlValue(section, "Key");
    if (!key) return null;
    return { key, size: Number.parseInt(extractXmlValue(section, "Size") ?? "0", 10) || 0, lastModified: extractXmlValue(section, "LastModified") };
  }).filter((item): item is R2ObjectInfo => Boolean(item));
  return { commonPrefixes, contents, isTruncated: extractXmlValue(xml, "IsTruncated") === "true", nextContinuationToken: extractXmlValue(xml, "NextContinuationToken") ?? undefined };
}

async function buildR2ErrorMessage(response: Response) {
  const text = await response.text();
  const message = extractXmlValue(text, "Message");
  if (message) return message;
  if (text.trim()) return text.trim();
  return response.statusText || "Cloudflare R2 request failed.";
}

async function signedR2Fetch(options: SignedR2FetchOptions) {
  const config = getR2Config();
  const client = getR2Client(config);
  const url = withQuery(buildR2Url(config, options.storageKey), options.query);
  const response = await client.fetch(url.toString(), { method: options.method, headers: options.headers, body: options.body, cache: "no-store" });
  if (!response.ok) {
    const message = await buildR2ErrorMessage(response);
    throw new Error(`Cloudflare R2 request failed (${response.status}): ${message}`);
  }
  return response;
}

async function listObjectsPage(options: { prefix: string; delimiter?: string; continuationToken?: string }) {
  const query: Array<[string, string]> = [["list-type", "2"], ["prefix", options.prefix]];
  if (options.delimiter) query.push(["delimiter", options.delimiter]);
  if (options.continuationToken) query.push(["continuation-token", options.continuationToken]);
  const response = await signedR2Fetch({ method: "GET", query });
  return parseListObjectsResult(await response.text());
}

export async function createUploadDescriptor(collectionSlug: string, filename: string, contentType: string) {
  const safeCollectionSlug = normalizeCollectionSlug(collectionSlug);
  if (!safeCollectionSlug) throw new Error("A collection slug is required before uploading artwork files.");
  const resolvedFolder = (await resolveCollectionFolderName(collectionSlug)) ?? safeCollectionSlug;
  const objectKey = `collections/${resolvedFolder}/originals/${randomUUID()}-${sanitizeFilename(filename)}`;
  const headers = { "content-type": contentType };
  const { url } = await createSignedR2Url({ method: "PUT", storageKey: objectKey, headers, expiresInSeconds: 300 });
  return { objectKey, uploadUrl: url, headers };
}

export async function ensureR2BrowserUploadCors(origins: string[]) {
  const safeOrigins = Array.from(new Set(origins.map((origin) => origin.trim().replace(/\/+$/, "")).filter((origin) => /^https?:\/\/[^/]+$/i.test(origin)))).sort();
  if (safeOrigins.length === 0) return;
  const cacheKey = safeOrigins.join("\n");
  if (browserUploadCorsCacheKey === cacheKey) return;
  try {
    await signedR2Fetch({ method: "PUT", query: [["cors", ""]], headers: { "content-type": "application/xml" }, body: buildCorsConfigurationXml(safeOrigins) });
    browserUploadCorsCacheKey = cacheKey;
  } catch (error) {
    console.warn(
      "Failed to automatically update Cloudflare R2 CORS configuration.\n" +
      "This is expected if your R2 API Token has standard Object Read & Write permission rather than Admin permission.\n" +
      "Ensure CORS is configured manually in the Cloudflare dashboard for this bucket. Error:",
      error
    );
  }
}

export function getPublicObjectUrl(storageKey: string) { const { publicBaseUrl } = getR2Config(); return `${publicBaseUrl}/${storageKey}`; }
export async function getSignedDownloadUrl(storageKey: string, expiresInSeconds: number) { return (await createSignedR2Url({ method: "GET", storageKey, expiresInSeconds })).url; }

export async function listTopLevelCollectionFolders() {
  const folders = new Set<string>();
  let continuationToken: string | undefined;
  do {
    const response = await listObjectsPage({ prefix: "collections/", delimiter: "/", continuationToken });
    for (const prefix of response.commonPrefixes) {
      const folder = prefix.replace(/^collections\//, "").replace(/\/$/, "");
      if (folder) folders.add(folder);
    }
    continuationToken = response.isTruncated ? response.nextContinuationToken : undefined;
  } while (continuationToken);
  return Array.from(folders);
}

export async function resolveCollectionFolderName(collectionSlug: string) {
  const normalized = normalizeCollectionSlug(collectionSlug);
  if (!normalized) return null;
  const folders = await listTopLevelCollectionFolders();
  return folders.find((folder) => folder === collectionSlug.trim() || normalizeCollectionSlug(folder) === normalized) ?? null;
}

export async function listObjectsByPrefix(prefix: string): Promise<R2ObjectInfo[]> {
  const safePrefix = prefix.trim();
  if (!safePrefix) throw new Error("A prefix is required to list objects.");
  const items: R2ObjectInfo[] = [];
  let continuationToken: string | undefined;
  do {
    const response = await listObjectsPage({ prefix: safePrefix, continuationToken });
    items.push(...response.contents);
    continuationToken = response.isTruncated ? response.nextContinuationToken : undefined;
  } while (continuationToken);
  return items;
}

export async function listCollectionObjects(collectionSlug: string): Promise<R2ObjectInfo[]> {
  const safeCollectionSlug = normalizeCollectionSlug(collectionSlug);
  if (!safeCollectionSlug) throw new Error("A collection slug is required to list objects.");
  const resolvedFolder = (await resolveCollectionFolderName(collectionSlug)) ?? safeCollectionSlug;
  return listObjectsByPrefix(`collections/${resolvedFolder}/`);
}

export async function getObjectBuffer(storageKey: string) {
  const response = await signedR2Fetch({ method: "GET", storageKey });
  return { body: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get("content-type") ?? "application/octet-stream" };
}

export async function getObjectText(storageKey: string) { const { body } = await getObjectBuffer(storageKey); return body.toString("utf8"); }

export async function putObjectBuffer(storageKey: string, body: Buffer | Uint8Array, contentType: string, options?: { cacheControl?: string }) {
  const bytes = Uint8Array.from(body);
  const headers: Record<string, string> = { "content-type": contentType, "content-length": String(bytes.byteLength) };
  if (options?.cacheControl) headers["cache-control"] = options.cacheControl;
  await signedR2Fetch({ method: "PUT", storageKey, headers, body: bytes });
}

export async function deleteObject(storageKey: string) {
  const safeStorageKey = storageKey.trim();
  if (!safeStorageKey) throw new Error("A storage key is required to delete an R2 object.");
  await signedR2Fetch({ method: "DELETE", storageKey: safeStorageKey });
}

export async function putObjectJson(storageKey: string, payload: unknown) {
  await putObjectBuffer(storageKey, Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, "utf8"), "application/json; charset=utf-8", { cacheControl: "public, max-age=60" });
}
