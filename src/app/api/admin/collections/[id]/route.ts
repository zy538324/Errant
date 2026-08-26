import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { syncCollectionManifest } from "@/lib/r2-collections";

const collectionSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(5000).nullable().optional(),
  coverAsset: z.string().trim().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(-10000).max(10000).optional().default(0),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const payload = collectionSchema.parse(await req.json());

    const existing = await db.collection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    }

    const collection = await db.collection.update({
      where: { id },
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description || null,
        coverAsset: payload.coverAsset || null,
        sortOrder: payload.sortOrder,
      },
    });

    await syncCollectionManifest(collection.slug).catch(() => null);
    if (existing.slug !== collection.slug) {
      await syncCollectionManifest(existing.slug).catch(() => null);
    }

    revalidatePath("/shop");
    revalidatePath("/portfolio");
    revalidatePath("/admin/collections");

    await writeAuditLog({
      userId: admin.id,
      action: "collection.update",
      entityType: "Collection",
      entityId: collection.id,
      metadata: { previousSlug: existing.slug, slug: collection.slug },
    });

    return NextResponse.json({ collection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update collection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const collection = await db.collection.findUnique({
      where: { id },
      include: { _count: { select: { artworks: true } } },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    }

    if (collection._count.artworks > 0) {
      return NextResponse.json(
        { error: `Cannot delete this collection because it still contains ${collection._count.artworks} artwork item(s). Move or archive those artworks first.` },
        { status: 409 },
      );
    }

    await db.collection.delete({ where: { id } });

    revalidatePath("/shop");
    revalidatePath("/portfolio");
    revalidatePath("/admin/collections");

    await writeAuditLog({
      userId: admin.id,
      action: "collection.delete",
      entityType: "Collection",
      entityId: id,
      metadata: { slug: collection.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete collection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
