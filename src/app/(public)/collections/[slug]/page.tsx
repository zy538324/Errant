import { notFound } from "next/navigation";
import { getCollectionManifest } from "@/lib/r2-collections";
import { RecentWorksCarousel } from "@/components/site/recent-works-carousel";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const collection = await getCollectionManifest(slug).catch(() => null);
  if (!collection || collection.works.length === 0) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
      <div className="text-xs uppercase tracking-[0.3em] text-stone-400">Collection</div>
      <h1 className="mt-3 font-serif text-5xl text-stone-50">{collection.title}</h1>

      <div className="mt-8">
        <RecentWorksCarousel works={collection.works} />
      </div>
    </main>
  );
}
