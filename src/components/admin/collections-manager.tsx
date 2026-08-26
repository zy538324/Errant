"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { friendlyErrorMessage } from "@/lib/friendly-errors";

type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverAsset: string | null;
  sortOrder: number;
  _count: { artworks: number };
};

type CollectionsManagerProps = { collections: CollectionRow[] };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

const emptyForm = { id: "", name: "", slug: "", description: "", coverAsset: "", sortOrder: "0" };

export function CollectionsManager({ collections }: CollectionsManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [merging, setMerging] = useState(false);
  const isEditing = Boolean(form.id);

  const sortedCollections = useMemo(() => [...collections].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)), [collections]);

  function edit(collection: CollectionRow) {
    setForm({ id: collection.id, name: collection.name, slug: collection.slug, description: collection.description ?? "", coverAsset: collection.coverAsset ?? "", sortOrder: String(collection.sortOrder) });
    setMessage(null);
  }

  function reset() { setForm(emptyForm); setMessage(null); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const payload = { name: form.name.trim(), slug: slugify(form.slug || form.name), description: form.description.trim() || null, coverAsset: form.coverAsset.trim() || null, sortOrder: Number.parseInt(form.sortOrder || "0", 10) || 0 };
    const response = await fetch(isEditing ? `/api/admin/collections/${form.id}` : "/api/admin/collections", { method: isEditing ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) { setMessage(friendlyErrorMessage(result?.error, "Unable to save collection.")); return; }
    setMessage(isEditing ? "Collection updated." : "Collection created.");
    setForm(emptyForm);
    router.refresh();
  }

  async function mergeDuplicates() {
    if (!window.confirm("Merge duplicate collections with the same name or slug? No images will be deleted; artworks will be moved into the kept collection.")) return;
    setMerging(true);
    setMessage(null);
    const response = await fetch("/api/admin/collections/dedupe", { method: "POST" });
    const result = await response.json().catch(() => null);
    setMerging(false);
    if (!response.ok) { setMessage(friendlyErrorMessage(result?.error, "Unable to merge duplicate collections.")); return; }
    setMessage(result?.mergedGroups ? `Merged ${result.mergedGroups} duplicate collection group(s).` : "No duplicate collections were found.");
    router.refresh();
  }

  async function remove(collection: CollectionRow) {
    if (collection._count.artworks > 0) { setMessage(`Cannot delete ${collection.name}: it still contains ${collection._count.artworks} artwork item(s). Move or archive those artworks first.`); return; }
    if (!window.confirm(`Delete collection "${collection.name}"? This cannot be undone.`)) return;
    const response = await fetch(`/api/admin/collections/${collection.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    if (!response.ok) { setMessage(friendlyErrorMessage(result?.error, "Unable to delete collection.")); return; }
    setMessage("Collection deleted.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={save} className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="text-xs uppercase tracking-[0.3em] text-stone-400">{isEditing ? "Edit collection" : "Add collection"}</div>
        <div className="mt-5 grid gap-4">
          <label className="block text-sm text-stone-300">Name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required /></label>
          <label className="block text-sm text-stone-300">Slug<input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required /></label>
          <label className="block text-sm text-stone-300">Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={5} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" /></label>
          <label className="block text-sm text-stone-300">Cover image URL / R2 key<input value={form.coverAsset} onChange={(event) => setForm((current) => ({ ...current, coverAsset: event.target.value }))} placeholder="Optional" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" /></label>
          <label className="block text-sm text-stone-300">Sort order<input value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value.replace(/[^0-9-]/g, "") }))} inputMode="numeric" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" /></label>
        </div>
        {message ? <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-200">{message}</div> : null}
        <div className="mt-5 flex flex-wrap gap-3"><Button type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save collection" : "Create collection"}</Button>{isEditing ? <button type="button" onClick={reset} className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5">Cancel edit</button> : null}<button type="button" onClick={mergeDuplicates} disabled={merging} className="rounded-full border border-amber-400/20 px-5 py-2.5 text-sm text-amber-100 hover:bg-amber-400/10 disabled:opacity-50">{merging ? "Merging..." : "Merge duplicate collections"}</button></div>
      </form>
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8"><div className="text-xs uppercase tracking-[0.3em] text-stone-400">Existing collections</div><div className="mt-5 space-y-3">{sortedCollections.length === 0 ? <p className="text-sm text-stone-300">No collections exist yet.</p> : sortedCollections.map((collection) => (<article key={collection.id} className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="font-medium text-stone-50">{collection.name}</div><div className="mt-1 text-xs text-stone-400">/{collection.slug} · sort {collection.sortOrder}</div><p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-300">{collection.description || "No description."}</p><div className="mt-3 text-xs text-stone-500">Artworks: {collection._count.artworks}</div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => edit(collection)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-100 hover:bg-white/5">Edit</button><button type="button" onClick={() => remove(collection)} className="rounded-full border border-rose-400/20 px-3 py-2 text-xs text-rose-100 hover:bg-rose-400/10">Delete</button></div></div></article>))}</div></section>
    </div>
  );
}
