import "server-only";
import { getOwnerPage, type OwnerSitePage } from "@/lib/app-content";

export type PublicPageContent = {
  key: string;
  title: string;
  eyebrow: string | null;
  intro: string | null;
  body: string | null;
  imageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
  metadata: Record<string, unknown>;
};

type PageFallback = {
  title: string;
  eyebrow?: string | null;
  intro?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  metadata?: Record<string, unknown>;
};

const placeholderSignatures: Record<string, Array<Pick<PageFallback, "title" | "intro">>> = {
  home: [{ title: "Home", intro: "Fine art, event and sports photography." }],
  about: [{ title: "About", intro: "Tell visitors about the artist and the work." }],
  shop: [{ title: "Shop", intro: "Browse available licensed digital downloads." }],
  portfolio: [{ title: "Portfolio", intro: "Explore selected images by collection, subject and event." }],
  contact: [{ title: "Contact", intro: "Use this page for enquiry and commission information." }],
};

function getParsedMetadata(page: OwnerSitePage | null) {
  try {
    const parsed = page?.metadataJson ? JSON.parse(page.metadataJson) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function parseMetadata(page: OwnerSitePage | null, fallback: PageFallback) {
  return { ...(fallback.metadata ?? {}), ...getParsedMetadata(page) };
}

function text(value: string | null | undefined, fallback: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback ?? null;
}

function sameText(left: string | null | undefined, right: string | null | undefined) {
  return (left ?? "").trim() === (right ?? "").trim();
}

function isPlaceholderPage(key: string, page: OwnerSitePage | null) {
  if (!page) return false;
  const metadata = getParsedMetadata(page);
  if (metadata.adminManaged === true) return false;

  return (placeholderSignatures[key] ?? []).some((placeholder) =>
    sameText(page.title, placeholder.title) && sameText(page.intro, placeholder.intro) && !page.body?.trim(),
  );
}

export async function getPublicPageContent(key: string, fallback: PageFallback): Promise<PublicPageContent> {
  const page = await getOwnerPage(key).catch(() => null);
  const usePage = page?.status === "PUBLISHED" && !isPlaceholderPage(key, page) ? page : null;

  return {
    key,
    title: text(usePage?.title, fallback.title) ?? fallback.title,
    eyebrow: text(usePage?.eyebrow, fallback.eyebrow),
    intro: text(usePage?.intro, fallback.intro),
    body: text(usePage?.body, fallback.body),
    imageUrl: text(usePage?.imageUrl, fallback.imageUrl),
    seoTitle: text(usePage?.seoTitle, fallback.seoTitle),
    seoDescription: text(usePage?.seoDescription, fallback.seoDescription),
    status: usePage?.status ?? "PUBLISHED",
    metadata: parseMetadata(usePage, fallback),
  };
}

export function metadataString(page: PublicPageContent, key: string, fallback = "") {
  const value = page.metadata[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function metadataNumber(page: PublicPageContent, key: string, fallback: number) {
  const value = page.metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function metadataBoolean(page: PublicPageContent, key: string, fallback: boolean) {
  const value = page.metadata[key];
  return typeof value === "boolean" ? value : fallback;
}
