import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { blogPostMutationSchema } from "@/lib/validators";

export async function GET() {
  await requireAdmin();

  const posts = await db.blogPost.findMany({
    include: { author: { select: { username: true } } },
    orderBy: [{ updatedAt: "desc" }],
  });

  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const payload = blogPostMutationSchema.parse(await req.json());

    const post = await db.blogPost.create({
      data: {
        title: payload.title,
        slug: payload.slug,
        excerpt: payload.excerpt,
        content: payload.content,
        status: payload.status,
        publishedAt: payload.status === "PUBLISHED" ? new Date() : null,
        authorId: admin.id,
      },
      include: { author: { select: { username: true } } },
    });

    await writeAuditLog({
      userId: admin.id,
      action: "blogPost.create",
      entityType: "BlogPost",
      entityId: post.id,
      metadata: { slug: post.slug, status: post.status },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create blog post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
