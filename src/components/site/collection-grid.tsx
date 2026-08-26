import Link from "next/link";
import { ArtworkCard } from "@/components/site/artwork-card";
import { listPublishedArtworks, type PublishedArtwork } from "@/modules/catalogue";

type CollectionGridProps = {
  works?: PublishedArtwork[];
  eyebrow?: string;
  title?: string;
  description?: string;
  emptyMessage?: string;
  ctaHref?: string | null;
  ctaLabel?: string;
};

export async function CollectionGrid({
  works: providedWorks,
  eyebrow,
  title,
  description,
  emptyMessage,
  ctaHref = "/shop",
  ctaLabel = "full catalogue",
}: CollectionGridProps) {
  const works: PublishedArtwork[] =
    providedWorks ??
    (await listPublishedArtworks().catch(() => [] as PublishedArtwork[]));
  const resolvedEyebrow = eyebrow?.trim() ?? "";
  const resolvedTitle = title?.trim() ?? "";
  const resolvedDescription = description?.trim() ?? "";
  const resolvedEmptyMessage = emptyMessage?.trim() ?? "";
  const showHeader =
    Boolean(resolvedEyebrow) || Boolean(resolvedTitle) || Boolean(resolvedDescription);

  return (
    <section id="featured" className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12">
      {showHeader ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {resolvedEyebrow ? (
              <div className="text-xs uppercase tracking-[0.3em] text-stone-400">
                {resolvedEyebrow}
              </div>
            ) : null}
            {resolvedTitle ? (
              <h2 className="mt-3 font-serif text-4xl text-stone-50">
                {resolvedTitle}
              </h2>
            ) : null}
          </div>
          {resolvedDescription ? (
            <p className="max-w-2xl text-base leading-8 text-stone-300">
              {resolvedDescription}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {works.length > 0 ? (
          works.map((work: PublishedArtwork) => (
            <ArtworkCard
              key={work.id}
              work={{
                href: `/work/${work.slug}`,
                slug: work.slug,
                title: work.title,
                category:
                  work.category ?? work.collection?.name ?? "Fine Art Photography",
                price:
                  work.pricePence > 0
                    ? `GBP ${(work.pricePence / 100).toFixed(0)}`
                    : "Gallery",
                image:
                  work.imageUrl ??
                  work.previewUrl ??
                  work.publicImageUrl ??
                  "/logo.png",
                alt: work.title,
              }}
            />
          ))
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-stone-300 lg:col-span-3">
            {resolvedEmptyMessage}
          </div>
        )}
      </div>
      {works.length > 0 && ctaHref ? (
        <div className="mt-8 text-sm text-stone-400">
          Looking for a specific piece? Browse the{" "}
          <Link
            href={ctaHref}
            className="text-brand-accent hover:text-brand-highlight"
          >
            {ctaLabel}
          </Link>
          .
        </div>
      ) : null}
    </section>
  );
}
