"use client";

type CollectionPayload = {
  name: string;
  slug?: string;
  description?: string | null;
  coverAsset?: string | null;
  sortOrder?: number;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Admin request failed.");
  }
  return payload as T;
}

export async function getCollections() {
  const response = await fetch("/api/artworks?publishedOnly=false", { cache: "no-store" });
  const payload = await readJson<{ artworks?: Array<{ collection?: { id: string; name: string; slug: string } | null }> }>(response);
  const byId = new Map<string, { id: string; name: string; slug: string }>();

  for (const artwork of payload.artworks ?? []) {
    if (artwork.collection?.id) {
      byId.set(artwork.collection.id, artwork.collection);
    }
  }

  return Array.from(byId.values()).sort((left, right) => left.name.localeCompare(right.name));
}

export async function createCollection(nameOrPayload: string | CollectionPayload) {
  const payload: CollectionPayload = typeof nameOrPayload === "string"
    ? { name: nameOrPayload, slug: slugify(nameOrPayload), sortOrder: 0 }
    : { ...nameOrPayload, slug: nameOrPayload.slug || slugify(nameOrPayload.name) };

  const response = await fetch("/api/admin/collections", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson(response);
}

export async function updateCollection(id: string, payload: CollectionPayload) {
  const response = await fetch(`/api/admin/collections/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...payload, slug: payload.slug || slugify(payload.name) }),
  });
  return readJson(response);
}

export async function deleteCollection(id: string) {
  const response = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
  return readJson(response);
}

export async function mergeCollections(_sourceId: string, _targetId: string) {
  throw new Error("Collection merge is not available in this build. Move artworks manually, then delete the empty collection.");
}

export async function getArtworks() {
  const response = await fetch("/api/artworks?publishedOnly=false", { cache: "no-store" });
  const payload = await readJson<{ artworks?: unknown[] }>(response);
  return payload.artworks ?? [];
}

export async function regeneratePreview(id: string) {
  const response = await fetch(`/api/artworks/${id}/regenerate-preview`, { method: "POST" });
  return readJson(response);
}

export async function quickPublish(id: string) {
  const response = await fetch(`/api/artworks/${id}/quick-publish`, { method: "POST" });
  return readJson(response);
}
