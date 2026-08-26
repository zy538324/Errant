"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadDropzone, type QueuedUpload } from "@/components/admin/upload-dropzone";

type CreatedArtwork = {
  id: string;
  title: string;
  slug: string;
  status: string;
  pricePence: number;
  collection?: { name: string; slug: string } | null;
  assets: Array<{ id: string; storageKey: string }>;
};

type UploadedAsset = {
  storageKey: string;
  filename: string;
  mimeType: string;
  bytes: number;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

type ArtworkEditorProps = {
  collections?: Array<{ id: string; name: string; slug: string }>;
};


export function ArtworkEditor({ collections = [] }: ArtworkEditorProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [collectionSlug, setCollectionSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [pricePounds, setPricePounds] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [uploads, setUploads] = useState<QueuedUpload[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdArtwork, setCreatedArtwork] = useState<CreatedArtwork | null>(null);

  const readyUploads = useMemo<UploadedAsset[]>(() => {
    return uploads
      .filter((upload): upload is QueuedUpload & { storageKey: string } => upload.status === "uploaded" && Boolean(upload.storageKey))
      .map((upload) => ({
        storageKey: upload.storageKey,
        filename: upload.file.name,
        mimeType: upload.file.type,
        bytes: upload.file.size,
      }));
  }, [uploads]);

  async function uploadFile(upload: QueuedUpload) {
    setUploads((current) =>
      current.map((item) =>
        item.id === upload.id ? { ...item, status: "uploading", error: undefined } : item
      )
    );

    // Step 1: request a presigned PUT URL from the server (tiny metadata-only payload,
    //         never hits server body payload limits).
    const presignResponse = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        collectionSlug,
        filename: upload.file.name,
        contentType: upload.file.type || "application/octet-stream",
        bytes: upload.file.size,
      }),
    });

    const presignResult = await presignResponse.json().catch(() => null);
    if (!presignResponse.ok) {
      throw new Error(presignResult?.error ?? "Unable to obtain upload URL.");
    }

    const { objectKey, uploadUrl, headers: uploadHeaders } = presignResult as {
      objectKey: string;
      uploadUrl: string;
      headers: Record<string, string>;
    };

    // Step 2: PUT the file directly to Cloudflare R2 — bypasses the application server completely.
    const r2Response = await fetch(uploadUrl, {
      method: "PUT",
      headers: uploadHeaders,
      body: upload.file,
    });

    if (!r2Response.ok) {
      throw new Error(`R2 upload failed (${r2Response.status}): ${r2Response.statusText}`);
    }

    // Step 3: mark the upload complete with the objectKey returned by presign.
    setUploads((current) =>
      current.map((item) =>
        item.id === upload.id
          ? { ...item, status: "uploaded", storageKey: objectKey, error: undefined }
          : item
      )
    );
  }


  async function handleFilesAdded(files: File[]) {
    if (!collectionSlug) {
      setMessage("Set the collection name/slug first so uploads can be placed into the correct R2 folder.");
      return;
    }

    const nextUploads = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "queued" as const,
    }));

    setUploads((current) => [...current, ...nextUploads]);
    setMessage(null);

    for (const upload of nextUploads) {
      try {
        await uploadFile(upload);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to upload image.";
        setUploads((current) => current.map((item) => (item.id === upload.id ? { ...item, status: "error", error: message } : item)));
        setMessage(message);
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setCreatedArtwork(null);

    try {
      const response = await fetch("/api/artworks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          collectionName,
          collectionSlug,
          description,
          category,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          previewImageUrl,
          pricePence: Math.round(Number(pricePounds || 0) * 100),
          currency: "GBP",
          status,
          uploads: readyUploads,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to create artwork.");
      }

      setCreatedArtwork(result.artwork);
      setMessage(`Saved ${result.artwork.title} with ${result.artwork.assets.length} uploaded original(s) in R2.`);
      setTitle("");
      setSlug("");
      setCollectionName("");
      setCollectionSlug("");
      setDescription("");
      setCategory("");
      setTags("");
      setPreviewImageUrl("");
      setPricePounds("");
      setStatus("DRAFT");
      setUploads([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create artwork.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8" onSubmit={handleSubmit}>
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-stone-400">Catalogue entry</div>
          <h2 className="mt-3 font-serif text-3xl text-stone-50">Add a new artwork</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">
            Upload one or more original images into Cloudflare R2, then capture the sales metadata needed to list and price the work.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-stone-300 md:col-span-2">
            Select Existing Collection
            <select
              value={collectionSlug}
              onChange={(e) => {
                const sel = collections.find(c => c.slug === e.target.value);
                if (sel) {
                  setCollectionName(sel.name);
                  setCollectionSlug(sel.slug);
                } else {
                  setCollectionName("");
                  setCollectionSlug("");
                }
              }}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none"
            >
              <option value="">Or create a new one below...</option>
              {collections.map(c => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-stone-300">
            Collection name
            <input value={collectionName} onChange={(event) => { const value = event.target.value; setCollectionName(value); if (!collectionSlug) setCollectionSlug(slugify(value)); }} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
          <label className="block text-sm text-stone-300">
            Collection slug
            <input value={collectionSlug} onChange={(event) => setCollectionSlug(slugify(event.target.value))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
        </div>

        <UploadDropzone uploads={uploads} disabled={submitting || !collectionSlug} onFilesAdded={handleFilesAdded} onRemove={(id) => setUploads((current) => current.filter((item) => item.id !== id))} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-stone-300">
            Title
            <input value={title} onChange={(event) => { const value = event.target.value; setTitle(value); if (!slug) setSlug(slugify(value)); }} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
          <label className="block text-sm text-stone-300">
            Slug
            <input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
          <label className="block text-sm text-stone-300">
            Category
            <input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
          </label>
          <label className="block text-sm text-stone-300">
            Price (GBP)
            <input value={pricePounds} onChange={(event) => setPricePounds(event.target.value)} inputMode="decimal" placeholder="145.00" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
          <label className="block text-sm text-stone-300 md:col-span-2">
            Tags
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="cathedral, stonework, atmosphere" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
          </label>
          <label className="block text-sm text-stone-300 md:col-span-2">
            Published preview URL
            <input
              value={previewImageUrl}
              onChange={(event) => setPreviewImageUrl(event.target.value)}
              placeholder="Optional: generated R2 preview is used when left blank"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none"
            />
            <div className="mt-2 text-xs leading-6 text-stone-400">
              Optional. Leave blank to use the generated R2 watermarked preview.
            </div>
          </label>
          <label className="block text-sm text-stone-300 md:col-span-2">
            Description
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
          </label>
          <label className="block text-sm text-stone-300">
            Publish state
            <select value={status} onChange={(event) => setStatus(event.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED")} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-300">
            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">R2 folder</div>
            <div className="mt-3 text-sm text-stone-50 break-all">
              {collectionSlug ? `collections/${collectionSlug}/originals/` : "Choose a collection slug to prepare the folder path."}
            </div>
            <div className="mt-3 text-xs uppercase tracking-[0.2em] text-stone-500">Uploaded originals: {readyUploads.length}</div>
          </div>
        </div>

        {message && <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-200">{message}</div>}

        <Button type="submit" disabled={submitting || readyUploads.length === 0 || uploads.some((upload) => upload.status === "uploading") || !collectionSlug || !collectionName}>
          {submitting ? "Saving artwork..." : "Create artwork"}
        </Button>
      </form>

      <aside className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 text-stone-300">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-stone-400">Workflow</div>
          <h2 className="mt-3 font-serif text-3xl text-stone-50">Cloudflare R2-backed catalogue uploads</h2>
        </div>
        <ul className="space-y-3 text-sm leading-7">
          <li>1. Use the collection slug to generate a tidy folder path in R2.</li>
          <li>2. A presigned PUT URL is requested from the server — only metadata (no file bytes) passes through the web server.</li>
          <li>3. The image is uploaded directly from your browser to Cloudflare R2, bypassing application server size limits entirely.</li>
          <li>4. A watermarked preview is generated server-side when the artwork is saved.</li>
          <li>5. Original files stay private for fulfilment and downloads.</li>
        </ul>
        {createdArtwork && (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            <div className="font-medium">Last saved artwork</div>
            <div className="mt-2">{createdArtwork.title} · {createdArtwork.slug}</div>
            <div className="mt-1">Collection: {createdArtwork.collection?.name ?? collectionName}</div>
            <div className="mt-1">{(createdArtwork.pricePence / 100).toFixed(2)} GBP · {createdArtwork.status}</div>
            <div className="mt-1">Original assets: {createdArtwork.assets.length}</div>
          </div>
        )}
      </aside>
    </div>
  );
}
