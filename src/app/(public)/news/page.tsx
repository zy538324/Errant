import { notFound } from "next/navigation";

/**
 * Public news is temporarily disabled (May 2026). Direct visits to /news return 404.
 * To restore: remove the `notFound()` call and uncomment the implementation below.
 */
export default function NewsPageDisabled() {
  notFound();
}

/*
import { getPublishedBlogPosts } from "@/lib/blog";
import { NewsPostsSection, type NewsPostSummary } from "./news-posts-section";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const posts = await getPublishedBlogPosts().catch(() => []);
  const summaries: NewsPostSummary[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    yearLabel: post.publishedAt ? String(post.publishedAt.getFullYear()) : "",
  }));

  return (
    <main className="bg-[#0f1112] px-6 py-16">
      <section className="mx-auto mb-8 max-w-5xl">
        <div className="text-xs uppercase tracking-[0.3em] text-stone-400">News</div>
        <h1 className="mt-3 font-serif text-5xl text-stone-50">Latest updates</h1>
        {summaries.length === 0 ? (
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-400">
            There are no published articles yet. New journal posts will appear here once they go live.
          </p>
        ) : null}
      </section>
      {summaries.length > 0 ? <NewsPostsSection posts={summaries} /> : null}
    </main>
  );
}
*/
