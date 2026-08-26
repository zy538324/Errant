"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type JournalPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  updatedAt: string;
  author: { username: string };
};

type JournalEditorProps = {
  initialPosts: JournalPost[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function createBlankPost(): JournalPost {
  return {
    id: "new",
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "DRAFT",
    publishedAt: null,
    updatedAt: new Date(0).toISOString(),
    author: { username: "Current admin" },
  };
}

export function JournalEditor({ initialPosts }: JournalEditorProps) {
  const [posts, setPosts] = useState<JournalPost[]>(initialPosts);
  const [selectedId, setSelectedId] = useState<string>(initialPosts[0]?.id ?? "new");
  const [draft, setDraft] = useState<JournalPost>(initialPosts[0] ?? createBlankPost());
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) ?? (selectedId === "new" ? createBlankPost() : draft),
    [draft, posts, selectedId]
  );

  function selectPost(post: JournalPost) {
    setSelectedId(post.id);
    setDraft(post);
    setMessage(null);
  }

  function startNewPost() {
    const blank = createBlankPost();
    setSelectedId("new");
    setDraft(blank);
    setMessage(null);
  }

  async function savePost(nextStatus: JournalPost["status"]) {
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        title: draft.title,
        slug: draft.slug || slugify(draft.title),
        excerpt: draft.excerpt,
        content: draft.content,
        status: nextStatus,
      };

      const isNew = selectedId === "new";
      const response = await fetch(isNew ? "/api/blog-posts" : `/api/blog-posts/${selectedId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save post.");
      }

      const savedPost: JournalPost = result.post;
      setPosts((current) => {
        const others = current.filter((post) => post.id !== savedPost.id);
        return [savedPost, ...others].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
      });
      setSelectedId(savedPost.id);
      setDraft(savedPost);
      setMessage(nextStatus === "PUBLISHED" ? "Post published." : "Draft saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save post.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost() {
    if (selectedId === "new") {
      startNewPost();
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/blog-posts/${selectedId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete post.");
      }

      const remaining = posts.filter((post) => post.id !== selectedId);
      setPosts(remaining);
      if (remaining[0]) {
        selectPost(remaining[0]);
      } else {
        startNewPost();
      }
      setMessage("Post deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete post.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-stone-400">Entries</div>
            <div className="mt-2 font-serif text-2xl text-stone-50">Journal library</div>
          </div>
          <Button type="button" variant="ghost" onClick={startNewPost}>New post</Button>
        </div>

        <div className="grid gap-3">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => selectPost(post)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${selectedId === post.id ? "border-brand-accent bg-brand-accent/10" : "border-white/10 bg-black/20 hover:bg-black/30"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-stone-100">{post.title}</div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400">{post.status}</span>
              </div>
              <div className="mt-2 text-xs text-stone-400">{post.slug}</div>
              <div className="mt-3 line-clamp-2 text-sm text-stone-300">{post.excerpt}</div>
            </button>
          ))}
          {posts.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-300">
              No journal posts yet. Create the first draft to begin publishing updates.
            </div>
          )}
        </div>
      </aside>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-stone-400">Editor</div>
            <h2 className="mt-3 font-serif text-4xl text-stone-50">{selectedId === "new" ? "New journal post" : selectedPost.title || "Untitled draft"}</h2>
          </div>
          <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-stone-400">
            {selectedPost.status}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-stone-300">
            Title
            <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
          <label className="block text-sm text-stone-300">
            Slug
            <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
          <label className="block text-sm text-stone-300 md:col-span-2">
            Excerpt
            <textarea value={draft.excerpt} onChange={(event) => setDraft((current) => ({ ...current, excerpt: event.target.value }))} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
          <label className="block text-sm text-stone-300 md:col-span-2">
            Body
            <textarea value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} rows={12} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" required />
          </label>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" variant="ghost" onClick={() => savePost("DRAFT")} disabled={saving || deleting}>
            {saving && draft.status === "DRAFT" ? "Saving..." : "Save draft"}
          </Button>
          <Button type="button" onClick={() => savePost("PUBLISHED")} disabled={saving || deleting}>
            {saving && draft.status === "PUBLISHED" ? "Publishing..." : "Publish"}
          </Button>
          <Button type="button" variant="outline" onClick={deletePost} disabled={deleting || saving}>
            {deleting ? "Deleting..." : selectedId === "new" ? "Reset" : "Delete"}
          </Button>
        </div>

        {message && <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-200">{message}</div>}
      </section>
    </div>
  );
}
