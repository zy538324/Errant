import "server-only";
import { cache } from "react";
const groq = String.raw;
export type PortableTextBlock = any;
import { createPublicHostedImageUrl } from "@/lib/protected-images";
import { getSanityReadClient } from "@/sanity/lib/client";

export type SiteSettingsContent = {
  siteTitle: string | null;
  siteDescription: string | null;
  heroEyebrow: string | null;
  heroTitle: string | null;
  heroDescription: string | null;
  brandStatement: string | null;
};

export type ArtistProfileContent = {
  name: string | null;
  headline: string | null;
  intro: string | null;
  location: string | null;
  portraitUrl: string | null;
  biography: PortableTextBlock[] | null;
  signatureName: string | null;
};

export type HomePageContent = {
  heroNotesEyebrow: string | null;
  heroNotes: Array<{ title: string; body: string }> | null;
  featuredEyebrow: string | null;
  featuredTitle: string | null;
  featuredDescription: string | null;
  protectionEyebrow: string | null;
  protectionTitle: string | null;
  protectionDescription: string | null;
  protectionPoints: string[] | null;
  workflowEyebrow: string | null;
  workflowTitle: string | null;
  workflowCards: Array<{ title: string; body: string }> | null;
};

export type ShopPageContent = {
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  gridEyebrow: string | null;
  gridTitle: string | null;
  gridDescription: string | null;
  emptyMessage: string | null;
};

export type PortfolioPageContent = {
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  emptyMessage: string | null;
};

export type ContactPageContent = {
  title: string | null;
  intro: string | null;
  body: PortableTextBlock[] | null;
};

export type SanityCollectionGroupRef = {
  title: string;
  slug: string;
};

export type SanityR2DownloadFile = {
  storageKey: string | null;
  mimeType: string | null;
  bytes: number | null;
  filename: string | null;
  uploadedAt: string | null;
};

export type SanityArtworkOverlay = {
  documentId: string;
  shopArtworkId: string | null;
  slug: string;
  title: string | null;
  category: string | null;
  description: string | null;
  collectionSlug: string | null;
  groups: SanityCollectionGroupRef[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  location: string | null;
  eventName: string | null;
  subjectTags: string[];
  previewAlt: string | null;
  pricePence: number | null;
  stockOnHand: number | null;
  currency: string | null;
  updatedAt: string | null;
  sourcePreviewUrl: string | null;
  protectedPreviewUrl: string | null;
  downloadFile: SanityR2DownloadFile | null;
};

export type SanityPortfolioItem = {
  id: string;
  slug: string;
  title: string | null;
  category: string | null;
  description: string | null;
  collectionSlug: string | null;
  groups: SanityCollectionGroupRef[];
  previewAlt: string | null;
  sortOrder: number | null;
  updatedAt: string | null;
  sourcePreviewUrl: string | null;
  protectedPreviewUrl: string | null;
};

const siteSettingsQuery = groq`*[_type == "siteSettings" && _id == "siteSettings"][0]{
  siteTitle,
  siteDescription,
  heroEyebrow,
  heroTitle,
  heroDescription,
  brandStatement
}`;

const artistProfileQuery = groq`*[_type == "artistProfile" && _id == "artistProfile"][0]{
  name,
  headline,
  intro,
  location,
  "portraitUrl": portrait.asset->url,
  biography,
  signatureName
}`;

const homePageContentQuery = groq`*[_type == "homePageContent" && _id == "homePageContent"][0]{
  heroNotesEyebrow,
  heroNotes[]{title, body},
  featuredEyebrow,
  featuredTitle,
  featuredDescription,
  protectionEyebrow,
  protectionTitle,
  protectionDescription,
  protectionPoints,
  workflowEyebrow,
  workflowTitle,
  workflowCards[]{title, body}
}`;

const shopPageContentQuery = groq`*[_type == "shopPageContent" && _id == "shopPageContent"][0]{
  eyebrow,
  title,
  description,
  gridEyebrow,
  gridTitle,
  gridDescription,
  emptyMessage
}`;

const portfolioPageContentQuery = groq`*[_type == "portfolioPageContent" && _id == "portfolioPageContent"][0]{
  eyebrow,
  title,
  description,
  emptyMessage
}`;

const contactPageContentQuery = groq`*[_type == "contactPageContent" && _id == "contactPageContent"][0]{
  title,
  intro,
  body
}`;

const artworkOverlayQuery = groq`*[_type == "artwork" && coalesce(isPublished, true) == true && defined(slug.current)]{
  "documentId": _id,
  "shopArtworkId": shopArtworkId,
  "slug": slug.current,
  title,
  category,
  description,
  collectionSlug,
  "groups": coalesce(groups[]->{title, "slug": slug.current}, []),
  seoTitle,
  seoDescription,
  "seoKeywords": coalesce(seoKeywords, []),
  location,
  eventName,
  "subjectTags": coalesce(subjectTags, []),
  previewAlt,
  pricePence,
  stockOnHand,
  currency,
  "updatedAt": coalesce(_updatedAt, _createdAt),
  "sourcePreviewUrl": coalesce(previewImage.asset->url, previewImageUrl),
  "downloadFile": downloadFile{
    storageKey,
    mimeType,
    bytes,
    filename,
    uploadedAt
  }
}`;

const portfolioItemQuery = groq`*[_type == "portfolioItem" && coalesce(isPublished, true) == true && defined(slug.current)] | order(coalesce(sortOrder, 0) asc, _updatedAt desc){
  "_id": _id,
  "slug": slug.current,
  title,
  category,
  description,
  collectionSlug,
  "groups": coalesce(groups[]->{title, "slug": slug.current}, []),
  previewAlt,
  sortOrder,
  "updatedAt": coalesce(_updatedAt, _createdAt),
  "sourcePreviewUrl": coalesce(previewImage.asset->url, previewImageUrl)
}`;

function createProtectedPreviewUrl(
  rawUrl: string | null,
) {
  if (!rawUrl) {
    return null;
  }

  try {
    return createPublicHostedImageUrl(rawUrl, {
      width: 1600,
    });
  } catch {
    return null;
  }
}

export const getSiteSettings = cache(async () => {
  const client = getSanityReadClient();
  if (!client) {
    return null;
  }

  try {
    return await client.fetch<SiteSettingsContent | null>(siteSettingsQuery, {}, {
      next: { revalidate: 60 },
    });
  } catch {
    return null;
  }
});

export const getArtistProfile = cache(async () => {
  const client = getSanityReadClient();
  if (!client) {
    return null;
  }

  try {
    return await client.fetch<ArtistProfileContent | null>(artistProfileQuery, {}, {
      next: { revalidate: 60 },
    });
  } catch {
    return null;
  }
});

export const getHomePageContent = cache(async () => {
  const client = getSanityReadClient();
  if (!client) {
    return null;
  }

  try {
    return await client.fetch<HomePageContent | null>(homePageContentQuery, {}, {
      next: { revalidate: 60 },
    });
  } catch {
    return null;
  }
});

export const getShopPageContent = cache(async () => {
  const client = getSanityReadClient();
  if (!client) {
    return null;
  }

  try {
    return await client.fetch<ShopPageContent | null>(shopPageContentQuery, {}, {
      next: { revalidate: 60 },
    });
  } catch {
    return null;
  }
});

export const getPortfolioPageContent = cache(async () => {
  const client = getSanityReadClient();
  if (!client) {
    return null;
  }

  try {
    return await client.fetch<PortfolioPageContent | null>(
      portfolioPageContentQuery,
      {},
      {
        next: { revalidate: 60 },
      },
    );
  } catch {
    return null;
  }
});

export const getContactPageContent = cache(async () => {
  const client = getSanityReadClient();
  if (!client) {
    return null;
  }

  try {
    return await client.fetch<ContactPageContent | null>(
      contactPageContentQuery,
      {},
      {
        next: { revalidate: 60 },
      },
    );
  } catch {
    return null;
  }
});

export const listPublishedSanityArtworkOverlays = cache(async () => {
  const client = getSanityReadClient();
  if (!client) {
    return [] as SanityArtworkOverlay[];
  }

  try {
    const results = await client.fetch<
      Array<Omit<SanityArtworkOverlay, "protectedPreviewUrl">>
    >(artworkOverlayQuery, {}, { next: { revalidate: 60 }, useCdn: false });

    return results.map((item) => ({
      ...item,
      protectedPreviewUrl: createProtectedPreviewUrl(item.sourcePreviewUrl),
    }));
  } catch {
    return [] as SanityArtworkOverlay[];
  }
});

export const listPublishedPortfolioItems = cache(async () => {
  const client = getSanityReadClient();
  if (!client) {
    return [] as SanityPortfolioItem[];
  }

  try {
    const results = await client.fetch<
      Array<Omit<SanityPortfolioItem, "protectedPreviewUrl">>
    >(portfolioItemQuery, {}, { next: { revalidate: 60 } });

    return results.map((item) => ({
      ...item,
      protectedPreviewUrl: createProtectedPreviewUrl(item.sourcePreviewUrl),
    }));
  } catch {
    return [] as SanityPortfolioItem[];
  }
});

export const getPublishedSanityArtworkOverlayBySlug = cache(
  async (slug: string) => {
    if (!slug.trim()) {
      return null;
    }

    const overlays = await listPublishedSanityArtworkOverlays();
    return overlays.find((item) => item.slug === slug) ?? null;
  },
);
