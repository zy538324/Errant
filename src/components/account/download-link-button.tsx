"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type DownloadLinkButtonProps = {
  entitlementId: string;
  downloadCount: number;
  maxDownloads: number;
};

type DownloadResponse = {
  url?: string;
  error?: string;
  downloadCount?: number;
  maxDownloads?: number;
  remainingDownloads?: number;
};

function parseDownloadFilename(contentDisposition: string | null) {
  const encodedMatch = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const fallbackMatch = contentDisposition?.match(/filename="([^"]+)"/i);
  return fallbackMatch?.[1] ?? "errant-arts-download";
}

function limitReachedMessage() {
  return "Download limit reached. Please contact support if you need help accessing your purchase.";
}

export function DownloadLinkButton({
  entitlementId,
  downloadCount,
  maxDownloads,
}: DownloadLinkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDownloadCount, setCurrentDownloadCount] = useState(downloadCount);
  const [currentMaxDownloads, setCurrentMaxDownloads] = useState(maxDownloads);
  const remainingDownloads = Math.max(0, currentMaxDownloads - currentDownloadCount);

  useEffect(() => {
    setCurrentDownloadCount(downloadCount);
    setCurrentMaxDownloads(maxDownloads);
  }, [downloadCount, maxDownloads]);

  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-xs text-stone-400" aria-live="polite">
        Downloads remaining: {remainingDownloads} of {currentMaxDownloads}
      </p>
      <Button
        size="sm"
        disabled={loading || remainingDownloads <= 0}
        onClick={async () => {
          setError(null);

          if (remainingDownloads <= 0) {
            setError(limitReachedMessage());
            return;
          }

          setLoading(true);

          try {
            const response = await fetch(`/api/downloads/${entitlementId}`, {
              method: "POST",
            });

            const payload = (await response.json().catch(() => null)) as
              | DownloadResponse
              | null;

            if (!response.ok || !payload?.url) {
              setError(
                payload?.error === "Download limit reached."
                  ? limitReachedMessage()
                  : payload?.error ?? "Unable to prepare your download.",
              );
              return;
            }

            const downloadResponse = await fetch(payload.url);

            if (!downloadResponse.ok) {
              const downloadError = (await downloadResponse.json().catch(() => null)) as
                | { error?: string }
                | null;
              setError(
                downloadError?.error === "Download limit reached."
                  ? limitReachedMessage()
                  : downloadError?.error ?? "Unable to download your file.",
              );
              return;
            }

            const blob = await downloadResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = parseDownloadFilename(
              downloadResponse.headers.get("content-disposition"),
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);

            const nextDownloadCount = Number.parseInt(
              downloadResponse.headers.get("x-download-count") ?? "",
              10,
            );
            const nextMaxDownloads = Number.parseInt(
              downloadResponse.headers.get("x-download-max") ?? "",
              10,
            );
            if (Number.isFinite(nextDownloadCount)) {
              setCurrentDownloadCount(nextDownloadCount);
            } else {
              setCurrentDownloadCount((current) => Math.min(current + 1, currentMaxDownloads));
            }
            if (Number.isFinite(nextMaxDownloads)) {
              setCurrentMaxDownloads(nextMaxDownloads);
            } else if (typeof payload.maxDownloads === "number") {
              setCurrentMaxDownloads(payload.maxDownloads);
            }
          } catch {
            setError("Unable to prepare your download.");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
        {remainingDownloads <= 0 ? "Limit reached" : "Download"}
      </Button>
      {remainingDownloads <= 0 && !error ? (
        <p className="max-w-xs text-xs leading-5 text-amber-200">
          {limitReachedMessage()}
        </p>
      ) : null}
      {error ? <p className="max-w-xs text-xs leading-5 text-rose-300">{error}</p> : null}
    </div>
  );
}
