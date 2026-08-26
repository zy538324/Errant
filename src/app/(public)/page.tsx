import { Hero } from "@/components/site/hero";
import {
  RecentWorksCarousel,
  type RecentWork,
} from "@/components/site/recent-works-carousel";
import { SocialFollowLinks } from "@/components/site/social-follow-links";
import { listPublishedArtworks, type PublishedArtwork } from "@/modules/catalogue";
import {
  getPublicPageContent,
  metadataBoolean,
  metadataNumber,
  metadataString,
} from "@/lib/public-page-content";

export const dynamic = "force-dynamic";

const homeFallback = {
  eyebrow: "Errant-Arts",
  title: "Fine Art & Sports Photography",
  intro: "Original photography for people who want striking artwork from real places, real moments, and live sport. Buy selected images as licensed digital downloads, ready to enjoy after checkout.",
  imageUrl: "/logo-black-and-white.png",
  metadata: {
    primaryLabel: "Shop digital downloads",
    primaryHref: "/shop",
    secondaryLabel: "View portfolio",
    secondaryHref: "/portfolio",
    showHeroLogo: true,
    heroLogoWidth: 500,
    heroLogoHeight: 333,
  },
};

function toRecentWork(artwork: PublishedArtwork): RecentWork | null {
  const image = artwork.imageUrl ?? artwork.previewUrl ?? artwork.publicImageUrl;
  if (!image) {
    return null;
  }

  return {
    id: artwork.id,
    slug: artwork.slug,
    title: artwork.title,
    category: artwork.category ?? artwork.collection?.name ?? null,
    image,
  };
}

export default async function HomePage() {
  const [pageContent, recentWorks] = await Promise.all([
    getPublicPageContent("home", homeFallback),
    listPublishedArtworks()
      .then((artworks) => artworks.map(toRecentWork).filter((work): work is RecentWork => Boolean(work)).slice(0, 10))
      .catch(() => [] as RecentWork[]),
  ]);

  return (
    <main>
      <Hero
        eyebrow={pageContent.eyebrow ?? homeFallback.eyebrow}
        title={pageContent.title}
        description={pageContent.intro ?? homeFallback.intro}
        primaryLabel={metadataString(pageContent, "primaryLabel", "Shop digital downloads")}
        primaryHref={metadataString(pageContent, "primaryHref", "/shop")}
        secondaryLabel={metadataString(pageContent, "secondaryLabel", "View portfolio")}
        secondaryHref={metadataString(pageContent, "secondaryHref", "/portfolio")}
        notes={[]}
        notesEyebrow={null}
        showHeroLogo={metadataBoolean(pageContent, "showHeroLogo", true)}
        heroLogoSrc={pageContent.imageUrl ?? "/logo-black-and-white.png"}
        heroLogoWidth={metadataNumber(pageContent, "heroLogoWidth", 500)}
        heroLogoHeight={metadataNumber(pageContent, "heroLogoHeight", 333)}
      />

      <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-10 lg:pb-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 md:p-6">
          <SocialFollowLinks />
        </div>
      </section>

      {recentWorks.length ? (
        <section className="mx-auto max-w-7xl px-6 py-6 lg:px-10 lg:py-10">
          <RecentWorksCarousel works={recentWorks} />
        </section>
      ) : null}
    </main>
  );
}
