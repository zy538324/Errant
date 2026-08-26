"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ArtworkEditFormProps = {
  artwork: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    category: string | null;
    pricePence: number;
    currency: string;
    stockOnHand: number | null;
    status: string;
    previewUrl: string | null;
    assets?: Array<{ id: string; kind: string; storageKey: string }>;
  };
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
}

export function ArtworkEditForm({ artwork }: ArtworkEditFormProps) {
  const router = useRouter();
  const originalAsset = artwork.assets?.find((asset) => asset.kind === "ORIGINAL") ?? null;
  const [title, setTitle] = useState(artwork.title);
  const [slug, setSlug] = useState(artwork.slug);
  const [description, setDescription] = useState(artwork.description ?? "");
  const [category, setCategory] = useState(artwork.category ?? "");
  const [pricePounds, setPricePounds] = useState((artwork.pricePence / 100).toFixed(2));
  const [stockOnHand, setStockOnHand] = useState(artwork.stockOnHand?.toString() ?? "");
  const [status, setStatus] = useState(artwork.status);
  const [previewUrl, setPreviewUrl] = useState(artwork.previewUrl ?? "");
  const [originalStorageKey, setOriginalStorageKey] = useState(originalAsset?.storageKey ?? "");
  const [deleteFiles, setDeleteFiles] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const response = await fetch(`/api/artworks/${artwork.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slugify(slug || title),
        description,
        category,
        pricePence: Math.round(Number(pricePounds || 0) * 100),
        stockOnHand: stockOnHand.trim() ? Number(stockOnHand) : null,
        status,
        previewUrl: previewUrl.trim() || null,
        originalStorageKey: originalStorageKey.trim() || undefined,
      }),
    });

    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setMessage(result?.error ?? "Unable to save artwork.");
      return;
    }

    setMessage("Artwork saved. Readiness and public pages have been refreshed.");
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      deleteFiles
        ? `This will delete "${artwork.title}" from the website. If the artwork has purchases, customer portal downloads will be preserved and R2 files will not be deleted. If there are no purchases, linked R2 files may be deleted. Continue?`
        : `This will delete "${artwork.title}" from the website. If customers have purchased it, it will remain available in their customer portal until their download limit is used. Cloudflare R2 files will be left in place. Continue?`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setMessage(null);
    const response = await fetch(`/api/artworks/${artwork.id}?deleteFiles=${deleteFiles ? "true" : "false"}`, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    setDeleting(false);

    if (!response.ok) {
      setMessage(result?.error ?? "Unable to delete artwork.");
      return;
    }

    if (result?.message) {
      setMessage(result.message);
      router.refresh();
      return;
    }

    if (result?.warning) {
      setMessage(result.warning);
      router.refresh();
      return;
    }

    router.push("/admin/artworks");
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <form className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-stone-300">Title
            <input value={title} onChange={(event) => { setTitle(event.target.value); if (!slug) setSlug(slugify(event.target.value)); }} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
          <label className="block text-sm text-stone-300">Slug
            <input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
          <label className="block text-sm text-stone-300">Category
            <input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
          </label>
          <label className="block text-sm text-stone-300">Price (£)
            <input value={pricePounds} onChange={(event) => setPricePounds(event.target.value)} inputMode="decimal" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
          <label className="block text-sm text-stone-300">Stock on hand
            <input value={stockOnHand} onChange={(event) => setStockOnHand(event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="Blank = unlimited digital" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
          </label>
          <label className="block text-sm text-stone-300">Publish state
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="block text-sm text-stone-300 md:col-span-2">Original R2 storage key
            <input value={originalStorageKey} onChange={(event) => setOriginalStorageKey(event.target.value)} placeholder="collections/collection-name/originals/file-name.jpg" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm text-stone-100 outline-none" />
            <span className="mt-2 block text-xs leading-6 text-stone-400">Use this to repair mismatched originals. Paste the R2 object key, not the public preview URL. Example: collections/rugby/originals/rugby-player-test.jpg</span>
          </label>
          <label className="block text-sm text-stone-300 md:col-span-2">Preview URL
            <input value={previewUrl} onChange={(event) => setPreviewUrl(event.target.value)} placeholder="https://bucket.errant-arts.co.uk/..." className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            <span className="mt-2 block text-xs leading-6 text-stone-400">For emergency preview correction only. After fixing the original key, use Generate Preview to rebuild the watermarked version.</span>
          </label>
          <label className="block text-sm text-stone-300 md:col-span-2">Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={6} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
          </label>
        </div>
        {message ? <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-200">{message}</div> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || deleting}>{saving ? "Saving..." : "Save artwork"}</Button>
          <button type="button" onClick={() => router.push("/admin/artworks")} className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5">Back to artworks</button>
        </div>
      </form>

      <section className="rounded-[2rem] border border-rose-400/20 bg-rose-400/10 p-8">
        <div className="text-xs uppercase tracking-[0.3em] text-rose-200">Danger zone</div>
        <h2 className="mt-3 font-serif text-3xl text-rose-50">Delete artwork from website</h2>
        <p className="mt-3 text-sm leading-7 text-rose-100/90">
          This will delete the image from the website/shop. If the artwork has purchase history, the database record and R2 files are preserved so existing customers can still download it from their customer portal until their limit is used.
        </p>
        <label className="mt-5 flex items-start gap-3 text-sm text-rose-50">
          <input type="checkbox" checked={deleteFiles} onChange={(event) => setDeleteFiles(event.target.checked)} className="mt-1" />
          <span>Also attempt to delete linked R2 image files only when there is no purchase/download/print history.</span>
        </label>
        <button type="button" onClick={handleDelete} disabled={saving || deleting} className="mt-5 rounded-full border border-rose-200/30 bg-rose-500/20 px-5 py-2.5 text-sm font-medium text-rose-50 hover:bg-rose-500/30 disabled:opacity-50">
          {deleting ? "Deleting..." : "Delete from website"}
        </button>
      </section>
    </div>
  );
}
