import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { blogPostMutationSchema } from "@/lib/validators";

export async function PATCH(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const admin = await requireAdmin();
    const { postId } = await params;
    const payload = blogPostMutationSchema.parse(await req.json());

    const existing = await db.blogPost.findUnique({ where: { id: postId } });
    if (!existing) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const post = await db.blogPost.update({
      where: { id: postId },
      data: {
        title: payload.title,
        slug: payload.slug,
        excerpt: payload.excerpt,
        content: payload.content,
        status: payload.status,
        publishedAt: payload.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : null,
        authorId: admin.id,
      },
      include: { author: { select: { username: true } } },
    });

    await writeAuditLog({
      userId: admin.id,
      action: "blogPost.update",
      entityType: "BlogPost",
      entityId: post.id,
      metadata: { slug: post.slug, status: post.status },
    });

    return NextResponse.json({ post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update blog post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const admin = await requireAdmin();
    const { postId } = await params;

    const existing = await db.blogPost.findUnique({ where: { id: postId } });
    if (!existing) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    await db.blogPost.delete({ where: { id: postId } });

    await writeAuditLog({
      userId: admin.id,
      action: "blogPost.delete",
      entityType: "BlogPost",
      entityId: postId,
      metadata: { slug: existing.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete blog post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
