import Link from "next/link";

export default function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <div className="border-b border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-6 py-4 lg:px-10">
          <Link
            href="/account"
            className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-stone-200 hover:bg-white/5"
          >
            Dashboard
          </Link>
          <Link
            href="/account/downloads"
            className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-stone-200 hover:bg-white/5"
          >
            Downloads
          </Link>
          <Link
            href="/account/privacy"
            className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-stone-200 hover:bg-white/5"
          >
            Privacy &amp; data
          </Link>
        </div>
      </div>
      {children}
    </>
  );
}

