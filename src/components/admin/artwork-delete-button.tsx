"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ArtworkDeleteButton({ artworkId, title }: { artworkId: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Permanently delete "${title}" from the catalogue and remove any linked test checkout/download rows? This is intended for unreleased test artwork only. If the artwork has real paid customer history, the request will be blocked and it will need to be removed from the website instead.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    const response = await fetch(`/api/artworks/${artworkId}?deleteFiles=false&permanent=true`, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    setDeleting(false);

    if (!response.ok) {
      window.alert(result?.error ?? "Unable to delete artwork.");
      return;
    }

    if (result?.message) {
      window.alert(result.message);
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-full border border-rose-400/20 px-3 py-2 text-xs text-rose-100 hover:bg-rose-400/10 disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
