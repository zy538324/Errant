import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { OwnerAdminNav, AdminPageHeader, AdminStatCard, formatCurrency } from "@/components/admin/owner-admin-nav";
import { QuickPublishButton, RegeneratePreviewButton } from "@/components/admin/shop-readiness-actions";

function computeArtworkIssues(artwork: any) {
  const issues: string[] = [];
  if (!artwork.hasOriginal) issues.push("Original image missing");
  if (!artwork.hasPreview) issues.push("Website preview missing");
  if (artwork.pricePence <= 0) issues.push("Price not set");
  if (artwork.status !== "PUBLISHED") issues.push("Artwork not visible");
  return issues;
}

export default async function ShopReadinessPage() {
  let admin;
  try { admin = await requireAdmin(); } catch { redirect("/admin/login?next=/admin/shop-readiness"); }

  const artworks = await db.artwork.findMany({ include: { collection: true, assets: true }, orderBy: { updatedAt: "desc" } });
  const rows = artworks.map((artwork) => {
    const hasOriginal = artwork.assets.some(a => a.kind === "ORIGINAL");
    const hasPreview = Boolean(artwork.previewUrl) || artwork.assets.some(a => a.kind === "PREVIEW" || a.kind === "WATERMARKED_PREVIEW");
    const issues = computeArtworkIssues({ ...artwork, hasOriginal, hasPreview });
    return { artwork, hasOriginal, hasPreview, issues, ready: issues.length === 0 };
  });

  const ready = rows.filter(r => r.ready).length;
  const blocked = rows.length - ready;

  return (
    <main className="content-shell py-12">
      <OwnerAdminNav username={admin.username} />
      <div className="mt-10">
        <AdminPageHeader eyebrow="Owner assurance" title="Shop readiness" description="Checklist for artworks with clear actionable reasons." />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <AdminStatCard label="Artworks checked" value={rows.length} />
        <AdminStatCard label="Ready" value={ready} />
        <AdminStatCard label="Needs attention" value={blocked} />
        <AdminStatCard label="Required" value="Image + Price + Preview" detail="Then publish" />
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
        <div className="grid gap-4 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-stone-400 md:grid-cols-[1.3fr_0.7fr_0.7fr_1.4fr_1fr]">
          <div>Artwork</div><div>Price</div><div>Visibility</div><div>Checks</div><div>Repair</div>
        </div>
        {rows.length === 0 ? <div className="p-8 text-sm text-stone-300">No artworks found.</div> : rows.map(({ artwork, hasOriginal, hasPreview, issues, ready }) => (
          <div key={artwork.id} className="grid gap-4 border-b border-white/10 px-5 py-4 last:border-b-0 md:grid-cols-[1.3fr_0.7fr_0.7fr_1.4fr_1fr]">
            <div>
              <div className="font-medium text-stone-50">{artwork.title}</div>
              <div className="mt-1 text-xs text-stone-400">{artwork.collection?.name ?? "Unassigned"} · /{artwork.slug}</div>
            </div>
            <div className="text-sm text-stone-300">{formatCurrency(artwork.pricePence, artwork.currency)}</div>
            <div className="text-sm text-stone-300">{artwork.status === "PUBLISHED" ? "Visible" : artwork.status === "ARCHIVED" ? "Archived" : "Hidden"}</div>
            <div>
              {issues.length > 0 ? (
                <span className="inline-flex rounded-full border px-2.5 py-1 text-xs border-rose-400/20 bg-rose-400/10 text-rose-100" title={issues.join("\n")}>{issues.join(" · ")}</span>
              ) : (
                <span className="inline-flex rounded-full border px-2.5 py-1 text-xs border-emerald-400/20 bg-emerald-400/10 text-emerald-100">Ready for shop</span>
              )}
              <div className="mt-2 text-xs text-stone-500">Original: {hasOriginal ? "OK" : "Missing"} · Preview: {hasPreview ? "OK" : "Missing"}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!hasPreview && hasOriginal ? <RegeneratePreviewButton artworkId={artwork.id} /> : null}
              {artwork.status !== "PUBLISHED" ? <QuickPublishButton artworkId={artwork.id} disabled={!hasOriginal || !hasPreview || artwork.pricePence <= 0} /> : null}
              <Link href={`/admin/artworks/${artwork.id}/edit`} className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-100 hover:bg-white/5">Open</Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}