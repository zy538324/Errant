import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedPreview } from "@/components/site/protected-preview";

type ArtworkCardWork = {
  href?: string;
  slug: string;
  title: string;
  category: string;
  price: string;
  image: string;
  alt: string;
};

export function ArtworkCard({ work }: { work: ArtworkCardWork }) {
  const href = work.href ?? `/work/${work.slug}`;

  return (
    <Card className="overflow-hidden bg-[#131516]">
      <ProtectedPreview alt={work.alt} src={work.image} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-stone-400">{work.category}</div>
            <div className="mt-2 font-serif text-2xl text-stone-50">{work.title}</div>
          </div>
          <div className="text-lg text-stone-100">{work.price}</div>
        </div>
        <div className="mt-5 flex gap-3">
          <Link href={href} className="inline-flex h-11 items-center justify-center rounded-full bg-stone-100 px-5 py-2.5 text-sm font-medium text-stone-950 transition-colors hover:bg-white">
            <ShoppingBag className="mr-2 h-4 w-4" />
            View &amp; Purchase
          </Link>
          <Link href={href} className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:bg-white/5">
            Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
