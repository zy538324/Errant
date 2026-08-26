"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { friendlyErrorMessage } from "@/lib/friendly-errors";

export function RegeneratePreviewButton({ artworkId, disabled }: { artworkId: string; disabled?: boolean }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function run() {
    setWorking(true);
    const response = await fetch(`/api/artworks/${artworkId}/regenerate-preview`, { method: "POST" });
    const result = await response.json().catch(() => null);
    setWorking(false);
    if (!response.ok) {
      window.alert(friendlyErrorMessage(result?.error, "Unable to generate the website preview."));
      return;
    }
    router.refresh();
  }

  return (
    <button type="button" onClick={run} disabled={disabled || working} className="rounded-full border border-emerald-400/20 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-400/10 disabled:opacity-50">
      {working ? "Generating..." : "Generate preview"}
    </button>
  );
}

export function QuickPublishButton({ artworkId, disabled }: { artworkId: string; disabled?: boolean }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function run() {
    if (!window.confirm("Publish this artwork and make it visible on the website?")) return;
    setWorking(true);
    const response = await fetch(`/api/artworks/${artworkId}/quick-publish`, { method: "POST" });
    const result = await response.json().catch(() => null);
    setWorking(false);
    if (!response.ok) {
      window.alert(friendlyErrorMessage(result?.error, "Unable to publish this artwork."));
      return;
    }
    router.refresh();
  }

  return (
    <button type="button" onClick={run} disabled={disabled || working} className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-100 hover:bg-white/5 disabled:opacity-50">
      {working ? "Publishing..." : "Publish"}
    </button>
  );
}
