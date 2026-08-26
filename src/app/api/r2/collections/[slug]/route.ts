import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listCollectionObjects } from "@/lib/storage";
import { syncCollectionManifest } from "@/lib/r2-collections";
import {
  createSignedStoragePreviewUrl,
  createSignedStorageProxyUrl,
} from "@/lib/watermark";

function buildAdminPreviewUrl(storageKey: string) {
  return (
    (/\/thumbs\/|-thumb\./i.test(storageKey)
      ? createSignedStorageProxyUrl(storageKey)
      : createSignedStoragePreviewUrl(storageKey, storageKey)) ?? "/logo.png"
  );
}

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();
    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: "Missing collection slug" }, { status: 400 });

    const items = await listCollectionObjects(slug);
    const urls = items.map((it) => ({
      url: buildAdminPreviewUrl(it.key),
      key: it.key,
      size: it.size,
      lastModified: it.lastModified,
    }));

    return NextResponse.json({ items: urls });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unable to list objects";
    const status = message.includes("Admin access denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Missing collection slug" }, { status: 400 });
    }

    const payload = await req.json().catch(() => ({}));
    const manifest = await syncCollectionManifest(slug, {
      overwriteExistingPreviews: payload?.overwriteExistingPreviews !== false,
    });

    return NextResponse.json({ manifest });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unable to generate manifest";
    const status = message.includes("Admin access denied") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
