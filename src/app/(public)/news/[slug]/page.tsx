import { notFound } from "next/navigation";

/**
 * Public news articles are temporarily disabled with /news.
 * To restore: remove the `notFound()` call and uncomment the implementation below.
 */
export default function NewsArticlePageDisabled() {
  notFound();
}

/*
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedBlogPostBySlug } from "@/lib/blog";

type NewsArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug).catch(() => null);
  if (!post) notFound();

  const dateLabel = post.publishedAt
    ? post.publishedAt.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const paragraphs = post.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="content-shell py-16 text-stone-300">
      <Link
        href="/news"
        className="text-sm text-brand-accent hover:text-brand-highlight"
      >
        ← Back to news
      </Link>
      <article className="mx-auto mt-8 max-w-3xl">
        <div className="text-xs uppercase tracking-[0.3em] text-stone-500">News</div>
        <h1 className="mt-3 font-serif text-4xl text-stone-50 md:text-5xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
          {dateLabel ? <time dateTime={post.publishedAt?.toISOString()}>{dateLabel}</time> : null}
          {post.author?.username ? <span>By {post.author.username}</span> : null}
        </div>
        {post.excerpt ? (
          <p className="mt-8 text-lg leading-8 text-stone-200">{post.excerpt}</p>
        ) : null}
        <div className="mt-10 space-y-6 text-lg leading-8">
          {paragraphs.map((block, index) => (
            <p key={index}>{block}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
*/
