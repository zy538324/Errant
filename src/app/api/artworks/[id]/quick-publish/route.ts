import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { getArtworkReadiness } from "@/lib/admin-readiness";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const artwork = await db.artwork.findUnique({
      where: { id },
      include: { collection: true, assets: true },
    });

    if (!artwork) {
      return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
    }

    const readiness = getArtworkReadiness({ ...artwork, status: "PUBLISHED" });
    const blockingReasons = readiness.checks
      .filter((check) => !check.ok && check.key !== "status")
      .map((check) => check.reason);

    if (blockingReasons.length > 0) {
      return NextResponse.json(
        { error: "Artwork cannot be published yet.", reasons: blockingReasons },
        { status: 400 },
      );
    }

    const updated = await db.artwork.update({
      where: { id },
      data: { status: "PUBLISHED" },
      include: { collection: true, assets: true },
    });

    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/artworks");
    revalidatePath("/admin/shop-readiness");
    revalidatePath(`/work/${updated.slug}`);

    await writeAuditLog({
      userId: admin.id,
      action: "artwork.quick-publish",
      entityType: "Artwork",
      entityId: updated.id,
      metadata: { slug: updated.slug, previousStatus: artwork.status, status: updated.status },
    });

    return NextResponse.json({ success: true, artwork: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish artwork.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
