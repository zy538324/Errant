"use client";

import { startTransition, useState } from "react";

type CollectionSyncPanelProps = {
  folders: Array<{
    folderName: string;
    slug: string;
  }>;
};

export function CollectionSyncPanel({ folders }: CollectionSyncPanelProps) {
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [syncedAtBySlug, setSyncedAtBySlug] = useState<Record<string, string>>({});

  async function syncFolder(folderName: string, slug: string) {
    setBusySlug(slug);
    setMessage(null);

    try {
      const response = await fetch(`/api/r2/collections/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ overwriteExistingPreviews: true }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to sync this collection.");
      }

      startTransition(() => {
        setSyncedAtBySlug((current) => ({
          ...current,
          [slug]: result.manifest?.updatedAt ?? new Date().toISOString(),
        }));
      });
      setMessage(`Synced ${folderName}: manifest.json updated and public preview thumbnails refreshed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sync this collection.");
    } finally {
      setBusySlug(null);
    }
  }

  if (folders.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-stone-300">
        No R2 collection folders were found yet.
      </div>
    );
  }

  return (
    <section className="space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-stone-400">R2 Sync</div>
        <h2 className="mt-3 font-serif text-3xl text-stone-50">Rebuild collection manifests and thumbnails</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300">
          Use this when a collection already exists in Cloudflare R2 and you want the app to regenerate
          `manifest.json` plus overwrite its preview thumbnails with watermarked JPEGs.
        </p>
      </div>

      <div className="grid gap-4">
        {folders.map((folder) => (
          <div
            key={folder.folderName}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <div className="text-sm font-medium text-stone-100">{folder.folderName}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                Public slug: {folder.slug}
              </div>
              {syncedAtBySlug[folder.slug] ? (
                <div className="mt-2 text-xs text-emerald-200">
                  Last synced: {new Date(syncedAtBySlug[folder.slug]).toLocaleString()}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => syncFolder(folder.folderName, folder.slug)}
              disabled={busySlug === folder.slug}
              className="inline-flex h-11 items-center justify-center rounded-full bg-stone-100 px-5 py-2.5 text-sm font-medium text-stone-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busySlug === folder.slug ? "Syncing..." : "Regenerate manifest"}
            </button>
          </div>
        ))}
      </div>

      {message ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-200">
          {message}
        </div>
      ) : null}
    </section>
  );
}
