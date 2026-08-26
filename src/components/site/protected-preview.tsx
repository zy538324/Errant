"use client";

import Image from "next/image";

function shouldBypassNextImage(src: string) {
  return src.startsWith("/api/") || /^https?:\/\//.test(src);
}

export function ProtectedPreview({ alt, src }: { alt: string; src: string }) {
  const unoptimized = shouldBypassNextImage(src);

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] bg-black/30"
      onContextMenu={(event) => event.preventDefault()}
    >
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={900}
        className="h-[22rem] w-full select-none object-contain opacity-90"
        draggable={false}
        unoptimized={unoptimized}
        sizes="(min-width: 1024px) 33vw, 100vw"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-90">
        <div className="rotate-[-30deg] border border-white/15 bg-black/35 px-6 py-2 text-xs uppercase tracking-[0.45em] text-white/80 backdrop-blur-sm">
          Preview
        </div>
      </div>
    </div>
  );
}
