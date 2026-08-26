import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArtworkEditForm } from "@/components/admin/artwork-edit-form";
import { AdminPageHeader, OwnerAdminNav, formatCurrency } from "@/components/admin/owner-admin-nav";

export default async function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const { id } = await params;
  const artwork = await db.artwork.findUnique({ where: { id }, include: { collection: true, assets: true } });
  if (!artwork) notFound();

  const original = artwork.assets.find((asset) => asset.kind === "ORIGINAL");
  const previewAsset = artwork.assets.find((asset) => asset.kind === "WATERMARKED_PREVIEW" || asset.kind === "PREVIEW");
  const ready = artwork.status === "PUBLISHED" && artwork.pricePence > 0 && Boolean(original);

  return (
    <main className="content-shell py-12">
      <OwnerAdminNav username={admin.username} />
      <div className="mt-10">
        <AdminPageHeader
          eyebrow="Owner catalogue"
          title={`Edit ${artwork.title}`}
          description="Update product metadata, price, stock and publication state. Image replacement remains controlled through the upload flow to avoid breaking customer downloads."
          action={<Link href="/admin/artworks" className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5">Back to artworks</Link>}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
            {artwork.previewUrl ? <Image src={artwork.previewUrl} alt={artwork.title} fill className="object-contain" unoptimized /> : <div className="flex h-full items-center justify-center text-sm text-stone-500">No preview URL</div>}
          </div>
          <div className="grid gap-3 text-sm text-stone-300">
            <div><span className="text-stone-500">Collection:</span> {artwork.collection?.name ?? "Unassigned"}</div>
            <div><span className="text-stone-500">Price:</span> {formatCurrency(artwork.pricePence, artwork.currency)}</div>
            <div><span className="text-stone-500">Original:</span> {original ? original.storageKey : "Missing"}</div>
            <div><span className="text-stone-500">Watermarked preview:</span> {previewAsset ? previewAsset.storageKey : "Missing"}</div>
            <div className={`rounded-2xl border p-3 ${ready ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-rose-400/20 bg-rose-400/10 text-rose-100"}`}>{ready ? "Shop ready" : "Needs review before relying on checkout"}</div>
          </div>
        </aside>
        <ArtworkEditForm artwork={artwork} />
      </div>
    </main>
  );
}
