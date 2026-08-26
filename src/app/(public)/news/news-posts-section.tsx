"use client";

/* Unused while public /news is disabled — kept for quick restore (see news/page.tsx). */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type NewsPostSummary = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  yearLabel: string;
};

type NewsPostsSectionProps = {
  posts: NewsPostSummary[];
};

export function NewsPostsSection({ posts }: NewsPostsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (posts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % posts.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [posts.length]);

  const active = posts[activeIndex] ?? posts[0];
  if (!active) return null;

  const goPrev = () => {
    setActiveIndex((current) => (current - 1 + posts.length) % posts.length);
  };

  const goNext = () => {
    setActiveIndex((current) => (current + 1) % posts.length);
  };

  return (
    <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-white/10 bg-gradient-to-br from-stone-100 to-stone-300 p-6 text-stone-950">
      {posts.length > 1 ? (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-full border border-stone-400/40 bg-white/60 p-2 hover:bg-white"
            aria-label="Previous article"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-full border border-stone-400/40 bg-white/60 p-2 hover:bg-white"
            aria-label="Next article"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[1.5rem] border border-stone-900/10 bg-white/70 p-3">
          <Link
            href={`/news/${active.slug}`}
            className="flex aspect-[4/3] flex-col items-center justify-center rounded-[1.25rem] border border-stone-900/10 bg-stone-200/50 p-6 text-center transition hover:bg-stone-200/70"
          >
            <div className="font-serif text-2xl text-stone-900">{active.title}</div>
            {active.yearLabel ? (
              <div className="mt-2 text-sm text-stone-600">{active.yearLabel}</div>
            ) : null}
            {active.excerpt ? (
              <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-700">{active.excerpt}</p>
            ) : null}
            <span className="mt-4 text-sm font-medium text-stone-900 underline-offset-4 hover:underline">
              Read article
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-2">
          {posts.map((post, index) => {
            const isActive = index === activeIndex;
            return (
              <Link
                key={post.id}
                href={`/news/${post.slug}`}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                className={`rounded-2xl border p-2 text-left transition ${
                  isActive
                    ? "border-stone-900 bg-white"
                    : "border-stone-900/10 bg-white/50 hover:bg-white/80"
                }`}
              >
                <div className="flex aspect-square items-center justify-center rounded-xl border border-stone-900/10 bg-stone-200/70">
                  <span className="text-xs font-medium text-stone-600">{index + 1}</span>
                </div>
                <div className="mt-2 text-sm font-medium leading-snug text-stone-900">{post.title}</div>
                {post.yearLabel ? (
                  <div className="text-xs text-stone-600">{post.yearLabel}</div>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
