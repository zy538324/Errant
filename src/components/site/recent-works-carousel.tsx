"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type RecentWork = {
  id: string;
  slug: string;
  title: string;
  year?: string | null;
  category?: string | null;
  image: string;
};

type RecentWorksCarouselProps = {
  works: RecentWork[];
};

function shouldBypassNextImage(src: string) {
  return src.startsWith("/api/") || /^https?:\/\//.test(src);
}

export function RecentWorksCarousel({ works }: RecentWorksCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(works.length - 1, 0)));
  }, [works.length]);

  useEffect(() => {
    if (works.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % works.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [works.length]);

  if (!works.length) return null;

  const activeWork = works[activeIndex] ?? works[0];
  const activeWorkUnoptimized = shouldBypassNextImage(activeWork.image);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.3em] text-stone-400">Recent works</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveIndex((current) => (current - 1 + works.length) % works.length)}
            className="rounded-full border border-white/20 p-2 text-stone-100 hover:bg-white/10"
            aria-label="Previous work"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((current) => (current + 1) % works.length)}
            className="rounded-full border border-white/20 p-2 text-stone-100 hover:bg-white/10"
            aria-label="Next work"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-black/40">
            <Image
              src={activeWork.image}
              alt={activeWork.title}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 66vw"
              unoptimized={activeWorkUnoptimized}
            />
          </div>
          <div className="mt-3">
            <div className="font-serif text-2xl text-stone-50">{activeWork.title}</div>
            <div className="text-sm text-stone-400">
              {[activeWork.year, activeWork.category].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-2">
          {works.map((work, index) => {
            const isActive = index === activeIndex;
            const unoptimized = shouldBypassNextImage(work.image);
            return (
              <button
                key={work.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`rounded-2xl border p-2 text-left transition ${
                  isActive
                    ? "border-white/30 bg-white/10"
                    : "border-white/10 bg-black/20 hover:bg-white/5"
                }`}
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-black/40">
                  <Image
                    src={work.image}
                    alt={work.title}
                    fill
                    className="object-contain"
                    sizes="160px"
                    unoptimized={unoptimized}
                  />
                </div>
                <div className="mt-2 truncate text-sm font-medium text-stone-100">{work.title}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
