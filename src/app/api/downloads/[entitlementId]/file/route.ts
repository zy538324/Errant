import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth";
import { getObjectBuffer } from "@/lib/storage";
import {
  getEntitlementDownloadDelivery,
  verifyDownloadGrant,
} from "@/modules/downloads";

function contentDispositionAttachment(filename: string) {
  const fallback = filename.replace(/[^a-zA-Z0-9._-]+/g, "-") || "errant-arts-download";
  const encoded = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, "%2A");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ entitlementId: string }> },
) {
  try {
    const customer = await requireCustomer();
    const { entitlementId } = await params;
    const url = new URL(req.url);
    verifyDownloadGrant({
      entitlementId,
      customerId: customer.id,
      expires: url.searchParams.get("expires"),
      signature: url.searchParams.get("signature"),
    });
    const delivery = await getEntitlementDownloadDelivery(entitlementId, customer.id, {
      incrementCount: true,
    });
    const object = await getObjectBuffer(delivery.storageKey);

    return new NextResponse(Uint8Array.from(object.body), {
      headers: {
        "content-type": delivery.mimeType || object.contentType || "application/octet-stream",
        "content-length": String(object.body.byteLength),
        "content-disposition": contentDispositionAttachment(delivery.filename),
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
        "x-download-count": String(delivery.downloadCount),
        "x-download-max": String(delivery.maxDownloads),
        "x-download-remaining": String(delivery.remainingDownloads),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Download limit reached."
        ? "Download limit reached. Please contact support if you need help accessing your purchase."
        : error instanceof Error
          ? error.message
          : "Download unavailable.";
    const status = message === "Customer authentication is required."
      ? 401
      : message === "Forbidden." || message.startsWith("Download limit reached.")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
