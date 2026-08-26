import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

function normaliseCollectionKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST() {
  try {
    const admin = await requireAdmin();
    const collections = await db.collection.findMany({
      include: { _count: { select: { artworks: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const groups = new Map<string, typeof collections>();
    for (const collection of collections) {
      const key = normaliseCollectionKey(collection.slug || collection.name);
      if (!key) continue;
      const current = groups.get(key) ?? [];
      current.push(collection);
      groups.set(key, current);
    }

    const merged: Array<{ key: string; kept: string; removed: string[]; movedArtworkCount: number }> = [];

    for (const [key, group] of groups) {
      if (group.length <= 1) continue;

      const sorted = [...group].sort((left, right) => {
        if (right._count.artworks !== left._count.artworks) return right._count.artworks - left._count.artworks;
        return left.createdAt.getTime() - right.createdAt.getTime();
      });
      const keeper = sorted[0];
      const duplicates = sorted.slice(1);
      let movedArtworkCount = 0;

      for (const duplicate of duplicates) {
        const update = await db.artwork.updateMany({
          where: { collectionId: duplicate.id },
          data: { collectionId: keeper.id },
        });
        movedArtworkCount += update.count;
        await db.collection.delete({ where: { id: duplicate.id } });
      }

      merged.push({
        key,
        kept: keeper.id,
        removed: duplicates.map((duplicate) => duplicate.id),
        movedArtworkCount,
      });
    }

    revalidatePath("/admin/collections");
    revalidatePath("/admin/artworks");
    revalidatePath("/shop");
    revalidatePath("/portfolio");

    await writeAuditLog({
      userId: admin.id,
      action: "collection.dedupe",
      entityType: "Collection",
      entityId: "bulk",
      metadata: { merged },
    });

    return NextResponse.json({ merged, mergedGroups: merged.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to merge duplicate collections.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
