import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

const collectionSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(5000).nullable().optional(),
  coverAsset: z.string().trim().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(-10000).max(10000).optional().default(0),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const payload = collectionSchema.parse(await req.json());
    const collection = await db.collection.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description || null,
        coverAsset: payload.coverAsset || null,
        sortOrder: payload.sortOrder,
      },
    });

    revalidatePath("/shop");
    revalidatePath("/portfolio");
    revalidatePath("/admin/collections");

    await writeAuditLog({
      userId: admin.id,
      action: "collection.create",
      entityType: "Collection",
      entityId: collection.id,
      metadata: { slug: collection.slug },
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create collection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
