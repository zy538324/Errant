import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/shop/add-to-cart";
import { PriceBadge } from "@/components/shop/price-badge";
import { ProtectedPreview } from "@/components/site/protected-preview";
import { getPublishedArtworkBySlug } from "@/modules/catalogue";

type WorkPageProps = { params: Promise<{ slug: string }> };

function compactText(value: string | null | undefined, fallback = "") {
  return (value ?? fallback).replace(/\s+/g, " ").trim();
}

function buildSeoDescription(artwork: Awaited<ReturnType<typeof getPublishedArtworkBySlug>>) {
  if (!artwork) {
    return "Original fine art and sports photography by Errant Arts.";
  }

  const description = compactText(
    artwork.seoDescription,
    artwork.description ?? "Original fine art and sports photography by Errant Arts.",
  );
  const extras = [artwork.eventName, artwork.location, artwork.category]
    .map((item) => compactText(item))
    .filter(Boolean);

  return [description, ...extras].join(" · ").slice(0, 170);
}

export async function generateMetadata({ params }: WorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getPublishedArtworkBySlug(slug).catch(() => null);

  if (!artwork) {
    return {
      title: "Artwork not found – Errant Arts",
    };
  }

  const title = compactText(artwork.seoTitle, `${artwork.title} – Errant Arts`);
  const description = buildSeoDescription(artwork);
  const imageUrl = artwork.imageUrl ?? artwork.previewUrl ?? artwork.publicImageUrl ?? "/logo.png";
  const keywords = [
    ...(artwork.seoKeywords ?? []),
    ...(artwork.subjectTags ?? []),
    artwork.category,
    artwork.location,
    artwork.eventName,
    "Errant Arts",
    "fine art photography",
    "sports photography",
  ]
    .map((item) => compactText(item))
    .filter(Boolean);

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "website",
      images: imageUrl ? [{ url: imageUrl, alt: artwork.previewAlt ?? artwork.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const artwork = await getPublishedArtworkBySlug(slug).catch(() => null);

  if (!artwork) {
    notFound();
  }

  const downloadAvailable = artwork.isDownloadAvailable;
  const imageAlt = artwork.previewAlt ?? artwork.seoTitle ?? artwork.title;
  const tags = [...(artwork.seoKeywords ?? []), ...(artwork.subjectTags ?? [])]
    .map((item) => compactText(item))
    .filter(Boolean)
    .slice(0, 12);

  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
      <ProtectedPreview
        alt={imageAlt}
        src={artwork.imageUrl ?? artwork.previewUrl ?? artwork.publicImageUrl ?? "/logo.png"}
      />
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-stone-400">{artwork.category ?? artwork.collection?.name ?? "Fine Art Photography"}</div>
        <h1 className="mt-3 font-serif text-5xl text-stone-50">{artwork.title}</h1>
        <div className="mt-6"><PriceBadge amount={`£${(artwork.pricePence / 100).toFixed(0)}`} /></div>
        <p className="mt-6 text-lg leading-8 text-stone-300">
          {artwork.description ??
            "A fine art digital edition from the Errant Arts collection, supplied with clear licensing after purchase."}
        </p>
        {artwork.location || artwork.eventName ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-stone-300">
            {artwork.eventName ? <div><strong className="text-stone-100">Event:</strong> {artwork.eventName}</div> : null}
            {artwork.location ? <div><strong className="text-stone-100">Location:</strong> {artwork.location}</div> : null}
          </div>
        ) : null}
        {tags.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-8 flex gap-4">
          <AddToCartButton
            item={downloadAvailable
              ? {
                  artworkId: artwork.id,
                  slug: artwork.slug,
                  title: artwork.title,
                  pricePence: artwork.pricePence,
                  imageUrl:
                    artwork.imageUrl ?? artwork.previewUrl ?? artwork.publicImageUrl ?? null,
                }
              : null}
          />
        </div>
        <p className="mt-4 max-w-xl rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-stone-300">
          {downloadAvailable ? (
            <>
              This checkout is for a licensed digital download.{" "}
              <Link
                href="/digital-download-licence"
                className="text-brand-accent underline underline-offset-4 hover:text-brand-highlight"
              >
                View digital download usage terms
              </Link>
              .
            </>
          ) : (
            "This artwork is visible for presentation, but the high-resolution digital download file has not been attached yet."
          )}
        </p>
      </div>
    </main>
  );
}
