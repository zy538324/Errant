"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UploadDropzone, type QueuedUpload } from "@/components/admin/upload-dropzone";
import type { OwnerPortfolioItem } from "@/lib/app-content";
import { friendlyErrorMessage } from "@/lib/friendly-errors";

type PortfolioManagerProps = { items: OwnerPortfolioItem[] };
type UploadedAsset = { storageKey: string; filename: string; mimeType: string; bytes: number };

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180); }
const emptyForm = { id: "", title: "", slug: "", description: "", category: "", collectionName: "", collectionSlug: "portfolio", groups: "", previewUrl: "", imageAlt: "", sortOrder: "0", status: "DRAFT" };

export function PortfolioManager({ items }: PortfolioManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [uploads, setUploads] = useState<QueuedUpload[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(form.id);
  const sortedItems = useMemo(() => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)), [items]);
  const readyUploads = useMemo<UploadedAsset[]>(() => uploads.filter((upload): upload is QueuedUpload & { storageKey: string } => upload.status === "uploaded" && Boolean(upload.storageKey)).map((upload) => ({ storageKey: upload.storageKey, filename: upload.file.name, mimeType: upload.file.type, bytes: upload.file.size })), [uploads]);

  function reset() { setForm(emptyForm); setUploads([]); setMessage(null); }
  function edit(item: OwnerPortfolioItem) { setForm({ id: item.id, title: item.title, slug: item.slug, description: item.description ?? "", category: item.category ?? "", collectionName: item.collectionName ?? "", collectionSlug: item.collectionSlug ?? "portfolio", groups: safeGroupsText(item.groupsJson), previewUrl: item.previewUrl ?? "", imageAlt: item.imageAlt ?? "", sortOrder: String(item.sortOrder), status: item.status }); setUploads([]); setMessage(null); }

  async function uploadFile(upload: QueuedUpload) {
    setUploads((current) => current.map((item) => item.id === upload.id ? { ...item, status: "uploading", error: undefined } : item));
    const formData = new FormData();
    formData.set("collectionSlug", form.collectionSlug || "portfolio");
    formData.set("file", upload.file);
    const response = await fetch("/api/uploads/file", { method: "POST", body: formData });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error ?? "Unable to upload image to storage.");
    setUploads((current) => current.map((item) => item.id === upload.id ? { ...item, status: "uploaded", storageKey: result.objectKey ?? result.storageKey, error: undefined } : item));
  }

  async function handleFilesAdded(files: File[]) {
    const nextUploads = files.slice(0, 1).map((file) => ({ id: crypto.randomUUID(), file, status: "queued" as const }));
    setUploads(nextUploads); setMessage(null);
    for (const upload of nextUploads) {
      try { await uploadFile(upload); } catch (error) { const friendly = friendlyErrorMessage(error, "Unable to upload image."); setUploads((current) => current.map((item) => item.id === upload.id ? { ...item, status: "error", error: friendly } : item)); setMessage(friendly); }
    }
  }

  async function save(event?: React.FormEvent<HTMLFormElement>, override?: Partial<typeof emptyForm>) {
    event?.preventDefault(); setSaving(true); setMessage(null);
    const nextForm = { ...form, ...override };
    const response = await fetch(isEditing ? `/api/admin/portfolio/${nextForm.id}` : "/api/admin/portfolio", { method: isEditing ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: nextForm.title, slug: slugify(nextForm.slug || nextForm.title), description: nextForm.description || null, category: nextForm.category || null, collectionName: nextForm.collectionName || null, collectionSlug: slugify(nextForm.collectionSlug || "portfolio"), groups: nextForm.groups.split(",").map((item) => item.trim()).filter(Boolean), previewUrl: nextForm.previewUrl || null, imageAlt: nextForm.imageAlt || null, sortOrder: Number.parseInt(nextForm.sortOrder || "0", 10) || 0, status: nextForm.status, upload: readyUploads[0] ?? null }) });
    const result = await response.json().catch(() => null); setSaving(false);
    if (!response.ok) { setMessage(friendlyErrorMessage(result?.error, "Unable to save portfolio item.")); return; }
    setMessage(isEditing ? "Portfolio item updated. You can view it on the website or keep editing." : "Portfolio item created.");
    if (!isEditing) setForm(emptyForm); else setForm((current) => ({ ...current, previewUrl: result?.item?.previewUrl ?? nextForm.previewUrl }));
    setUploads([]); router.refresh();
  }

  async function removeImage() { if (!form.previewUrl && uploads.length === 0) return; if (isEditing && !window.confirm("Remove the image from this portfolio item? The uploaded file will be left in storage.")) return; setForm((current) => ({ ...current, previewUrl: "" })); setUploads([]); if (isEditing) await save(undefined, { previewUrl: "" }); }
  async function remove(item: OwnerPortfolioItem) { if (!window.confirm(`Delete portfolio item "${item.title}"?`)) return; const response = await fetch(`/api/admin/portfolio/${item.id}`, { method: "DELETE" }); const result = await response.json().catch(() => null); if (!response.ok) { setMessage(friendlyErrorMessage(result?.error, "Unable to delete portfolio item.")); return; } setMessage("Portfolio item deleted."); router.refresh(); }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={(event) => save(event)} className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="text-xs uppercase tracking-[0.3em] text-stone-400">{isEditing ? "Edit portfolio item" : "Add portfolio item"}</div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-stone-300">Portfolio items are gallery-only images. They do not need a price and are not sold in the shop.</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-stone-300">Title<input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required /></label>
          <label className="block text-sm text-stone-300">Slug<input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required /></label>
          <label className="block text-sm text-stone-300">Category<input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" /></label>
          <label className="block text-sm text-stone-300">Collection slug<input value={form.collectionSlug} onChange={(event) => setForm((current) => ({ ...current, collectionSlug: slugify(event.target.value) }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" /></label>
          <label className="block text-sm text-stone-300">Collection name<input value={form.collectionName} onChange={(event) => setForm((current) => ({ ...current, collectionName: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" /></label>
          <label className="block text-sm text-stone-300">Sort order<input value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value.replace(/[^0-9-]/g, "") }))} inputMode="numeric" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" /></label>
          <label className="block text-sm text-stone-300 md:col-span-2">Groups / tags<input value={form.groups} onChange={(event) => setForm((current) => ({ ...current, groups: event.target.value }))} placeholder="Landscape, Motorsport, Events" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" /></label>
          <label className="block text-sm text-stone-300 md:col-span-2">Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={5} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" /></label>
          <label className="block text-sm text-stone-300 md:col-span-2">Image URL<input value={form.previewUrl} onChange={(event) => setForm((current) => ({ ...current, previewUrl: event.target.value }))} placeholder="Optional if uploading below" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" /></label>
          <label className="block text-sm text-stone-300 md:col-span-2">Image alt text<input value={form.imageAlt} onChange={(event) => setForm((current) => ({ ...current, imageAlt: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" /></label>
          <label className="block text-sm text-stone-300">Website visibility<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none"><option value="DRAFT">Hidden / Draft</option><option value="PUBLISHED">Visible / Published</option><option value="ARCHIVED">Archived</option></select></label>
        </div>
        <div className="mt-5"><UploadDropzone uploads={uploads} onFilesAdded={handleFilesAdded} onRemove={(id) => setUploads((current) => current.filter((item) => item.id !== id))} disabled={saving} /></div>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={removeImage} className="rounded-full border border-rose-400/20 px-4 py-2 text-xs text-rose-100 hover:bg-rose-400/10">Remove image from item</button>{form.slug ? <Link href={`/portfolio/${form.slug}`} className="rounded-full border border-white/10 px-4 py-2 text-xs text-stone-100 hover:bg-white/5">View on website</Link> : null}</div>
        {message ? <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-200">{message}</div> : null}
        <div className="mt-5 flex flex-wrap gap-3"><Button type="submit" disabled={saving || uploads.some((upload) => upload.status === "uploading")}>{saving ? "Saving..." : isEditing ? "Save portfolio item" : "Create portfolio item"}</Button>{isEditing ? <button type="button" onClick={reset} className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5">Cancel edit</button> : null}</div>
      </form>
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8"><div className="text-xs uppercase tracking-[0.3em] text-stone-400">Existing portfolio</div><div className="mt-5 space-y-3">{sortedItems.length === 0 ? <p className="text-sm text-stone-300">No portfolio items exist yet.</p> : sortedItems.map((item) => (<article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="flex gap-4"><div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">{item.previewUrl ? <Image src={item.previewUrl} alt={item.imageAlt || item.title} fill className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-xs text-stone-500">No image</div>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-medium text-stone-50">{item.title}</div><div className="mt-1 text-xs text-stone-400">/{item.slug} · sort {item.sortOrder}</div></div><span className={`rounded-full border px-2.5 py-1 text-xs ${item.status === "PUBLISHED" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-amber-400/20 bg-amber-400/10 text-amber-100"}`}>{item.status === "PUBLISHED" ? "Visible" : item.status}</span></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-300">{item.description || "No description."}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => edit(item)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-100 hover:bg-white/5">Edit</button><Link href={`/portfolio/${item.slug}`} className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-100 hover:bg-white/5">View</Link><button type="button" onClick={() => remove(item)} className="rounded-full border border-rose-400/20 px-3 py-2 text-xs text-rose-100 hover:bg-rose-400/10">Delete</button></div></div></div></article>))}</div></section>
    </div>
  );
}

function safeGroupsText(value: string) { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.join(", ") : ""; } catch { return ""; } }
