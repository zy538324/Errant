"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
}

export function NewsEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/admin/news", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, slug: slug || slugify(title), excerpt, content, status }),
    });
    const result = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setMessage(result?.error ?? "Unable to save news post.");
      return;
    }
    setTitle(""); setSlug(""); setExcerpt(""); setContent(""); setStatus("DRAFT");
    setMessage("News post saved.");
    router.refresh();
  }

  return (
    <form className="rounded-[2rem] border border-white/10 bg-white/5 p-8" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-stone-300">Title
          <input value={title} onChange={(event) => { setTitle(event.target.value); if (!slug) setSlug(slugify(event.target.value)); }} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
        </label>
        <label className="block text-sm text-stone-300">Slug
          <input value={slug} onChange={(event) => setSlug(slugify(event.target.value))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
        </label>
        <label className="block text-sm text-stone-300 md:col-span-2">Excerpt
          <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
        </label>
        <label className="block text-sm text-stone-300 md:col-span-2">Body
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={10} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
        </label>
        <label className="block text-sm text-stone-300">Status
          <select value={status} onChange={(event) => setStatus(event.target.value as "DRAFT" | "PUBLISHED")} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </label>
      </div>
      {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-200">{message}</div> : null}
      <Button type="submit" className="mt-5" disabled={saving}>{saving ? "Saving..." : "Save news post"}</Button>
    </form>
  );
}
