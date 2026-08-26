import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getOwnerPortfolioItem, upsertOwnerPortfolioItem } from "@/lib/app-content";
import { getPublicObjectUrl } from "@/lib/storage";
import { writeAuditLog } from "@/lib/audit";

const uploadSchema = z.object({
  storageKey: z.string().min(1),
  filename: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(1),
  bytes: z.number().int().positive(),
}).nullable().optional();

const portfolioSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(5000).nullable().optional(),
  category: z.string().trim().max(120).nullable().optional(),
  collectionName: z.string().trim().max(160).nullable().optional(),
  collectionSlug: z.string().trim().max(120).nullable().optional(),
  groups: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
  previewUrl: z.string().trim().url().nullable().optional(),
  imageAlt: z.string().trim().max(240).nullable().optional(),
  sortOrder: z.number().int().min(-10000).max(10000).optional().default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  upload: uploadSchema,
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const existing = await getOwnerPortfolioItem(id);
    if (!existing) {
      return NextResponse.json({ error: "Portfolio item not found." }, { status: 404 });
    }

    const payload = portfolioSchema.parse(await req.json());
    const previewUrl = payload.upload?.storageKey ? getPublicObjectUrl(payload.upload.storageKey) : payload.previewUrl || null;
    const item = await upsertOwnerPortfolioItem({
      id,
      title: payload.title,
      slug: payload.slug,
      description: payload.description || null,
      category: payload.category || null,
      collectionName: payload.collectionName || null,
      collectionSlug: payload.collectionSlug || null,
      groupsJson: JSON.stringify(payload.groups),
      previewUrl,
      imageAlt: payload.imageAlt || payload.title,
      sortOrder: payload.sortOrder,
      status: payload.status,
    });

    revalidatePath("/portfolio");
    revalidatePath("/admin/portfolio");

    await writeAuditLog({
      userId: admin.id,
      action: "portfolio.update",
      entityType: "PortfolioItem",
      entityId: item.id,
      metadata: { previousSlug: existing.slug, slug: item.slug, status: item.status, upload: payload.upload?.storageKey ?? null },
    });

    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update portfolio item.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const existing = await getOwnerPortfolioItem(id);
    if (!existing) {
      return NextResponse.json({ error: "Portfolio item not found." }, { status: 404 });
    }

    const item = await upsertOwnerPortfolioItem({
      id,
      title: existing.title,
      slug: existing.slug,
      description: existing.description,
      category: existing.category,
      collectionName: existing.collectionName,
      collectionSlug: existing.collectionSlug,
      groupsJson: existing.groupsJson,
      previewUrl: existing.previewUrl,
      imageAlt: existing.imageAlt,
      sortOrder: existing.sortOrder,
      status: "ARCHIVED",
    });

    revalidatePath("/portfolio");
    revalidatePath("/admin/portfolio");

    await writeAuditLog({
      userId: admin.id,
      action: "portfolio.archive-delete",
      entityType: "PortfolioItem",
      entityId: id,
      metadata: { slug: existing.slug, suppressesLegacySource: true },
    });

    return NextResponse.json({ success: true, item, message: "Portfolio item removed from the public page and retained as an archive record." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete portfolio item.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
