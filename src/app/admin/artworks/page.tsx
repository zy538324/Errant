import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getArtworkReadiness } from "@/lib/admin-readiness";
import { AdminPageHeader, AdminStatCard, formatCurrency, OwnerAdminNav } from "@/components/admin/owner-admin-nav";
import { ArtworkDeleteButton } from "@/components/admin/artwork-delete-button";
import { ArtworkRepairActions } from "@/components/admin/artwork-repair-actions";
import { Button } from "@/components/ui/button";

function statusClass(status: string) {
  if (status === "PUBLISHED") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (status === "ARCHIVED") return "border-stone-400/20 bg-stone-400/10 text-stone-200";
  return "border-amber-400/20 bg-amber-400/10 text-amber-100";
}

function checkClass(ok: boolean) {
  return ok
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
    : "border-rose-400/20 bg-rose-400/10 text-rose-100";
}

export default async function AdminArtworksPage() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/artworks");
  }

  const artworks = await db.artwork.findMany({ include: { collection: true, assets: true }, orderBy: { updatedAt: "desc" } });
  const readinessById = new Map(artworks.map((artwork) => [artwork.id, getArtworkReadiness(artwork)]));
  const published = artworks.filter((artwork) => artwork.status === "PUBLISHED").length;
  const drafts = artworks.filter((artwork) => artwork.status === "DRAFT").length;
  const blocked = artworks.filter((artwork) => !readinessById.get(artwork.id)?.isReady).length;
  const missingPreviews = artworks.filter((artwork) => !readinessById.get(artwork.id)?.previewAsset && !artwork.previewUrl).length;

  return (
    <main className="content-shell py-12">
      <OwnerAdminNav username={admin.username} />
      <div className="mt-10">
        <AdminPageHeader
          eyebrow="Owner catalogue"
          title="Artworks"
          description="Manage shop-ready artwork records, image availability, pricing, stock and publication state from one owner-friendly page."
          action={<Link href="/admin/artworks/new"><Button>Add new artwork</Button></Link>}
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <AdminStatCard label="Total" value={artworks.length} />
        <AdminStatCard label="Published" value={published} />
        <AdminStatCard label="Drafts" value={drafts} />
        <AdminStatCard label="Needs review" value={blocked} detail="Fails one or more shop-readiness checks" />
        <AdminStatCard label="Missing previews" value={missingPreviews} detail="Can usually be repaired from originals" />
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
        <div className="grid gap-4 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-stone-400 md:grid-cols-[92px_1.25fr_0.9fr_0.6fr_0.75fr_1.35fr_1.25fr]">
          <div>Preview</div><div>Artwork</div><div>Collection</div><div>Price</div><div>Status</div><div>Checks</div><div>Repair</div>
        </div>
        {artworks.length === 0 ? <div className="p-8 text-sm text-stone-300">No artworks exist yet.</div> : artworks.map((artwork) => {
          const readiness = readinessById.get(artwork.id) ?? getArtworkReadiness(artwork);
          const preview = readiness.previewUrl;
          return (
            <div key={artwork.id} className="grid gap-4 border-b border-white/10 px-5 py-4 last:border-b-0 md:grid-cols-[92px_1.25fr_0.9fr_0.6fr_0.75fr_1.35fr_1.25fr]">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {preview ? <Image src={preview} alt={artwork.title} fill className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-xs text-stone-500">No image</div>}
              </div>
              <div>
                <div className="font-medium text-stone-50">{artwork.title}</div>
                <div className="mt-1 text-xs text-stone-400">/{artwork.slug}</div>
                <div className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs ${readiness.isReady ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-rose-400/20 bg-rose-400/10 text-rose-100"}`}>{readiness.isReady ? "Shop ready" : "Needs review"}</div>
                {!readiness.isReady ? (
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-stone-400">
                    {readiness.reasons.slice(0, 3).map((reason) => <li key={reason}>• {reason}</li>)}
                  </ul>
                ) : null}
              </div>
              <div className="text-sm text-stone-300">{artwork.collection?.name ?? "Unassigned"}</div>
              <div className="text-sm text-stone-300">{formatCurrency(artwork.pricePence, artwork.currency)}</div>
              <div><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${statusClass(artwork.status)}`}>{artwork.status}</span></div>
              <div className="flex flex-wrap gap-2">
                {readiness.checks.map((check) => (
                  <span key={check.key} title={check.reason} className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${checkClass(check.ok)}`}>
                    {check.ok ? "✓" : "!"} {check.label}
                  </span>
                ))}
              </div>
              <div className="space-y-3">
                <ArtworkRepairActions artworkId={artwork.id} />
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/artworks/${artwork.id}/edit`} className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-100 hover:bg-white/5">Edit</Link>
                  <Link href={`/work/${artwork.slug}`} className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-100 hover:bg-white/5">View</Link>
                  <ArtworkDeleteButton artworkId={artwork.id} title={artwork.title} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
