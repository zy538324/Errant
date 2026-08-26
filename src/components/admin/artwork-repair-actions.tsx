"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    const reasons = "reasons" in payload && Array.isArray(payload.reasons) ? ` ${payload.reasons.join(" ")}` : "";
    return `${payload.error}${reasons}`;
  }
  return fallback;
}

export function ArtworkRepairActions({ artworkId }: { artworkId: string }) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<"preview" | "publish" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function runAction(action: "preview" | "publish", url: string) {
    setBusyAction(action);
    setMessage(null);

    try {
      const response = await fetch(url, { method: "POST" });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(getErrorMessage(payload, "The repair action failed."));
        return;
      }

      setMessage(action === "preview" ? "Preview regenerated." : "Artwork published.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The repair action failed.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => runAction("preview", `/api/artworks/${artworkId}/regenerate-preview`)}
          disabled={Boolean(busyAction)}
          className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-100 hover:bg-white/5 disabled:cursor-wait disabled:opacity-60"
        >
          {busyAction === "preview" ? "Generating..." : "Generate preview"}
        </button>
        <button
          type="button"
          onClick={() => runAction("publish", `/api/artworks/${artworkId}/quick-publish`)}
          disabled={Boolean(busyAction)}
          className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-400/15 disabled:cursor-wait disabled:opacity-60"
        >
          {busyAction === "publish" ? "Publishing..." : "Quick publish"}
        </button>
      </div>
      {message ? <p className="max-w-xs text-xs leading-5 text-stone-300">{message}</p> : null}
    </div>
  );
}
