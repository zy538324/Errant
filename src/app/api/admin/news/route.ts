import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { blogPostMutationSchema } from "@/lib/validators";

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
    });

    revalidatePath("/news");
    revalidatePath(`/news/${post.slug}`);

    await writeAuditLog({
      userId: admin.id,
      action: "news.create",
      entityType: "BlogPost",
      entityId: post.id,
      metadata: { slug: post.slug, status: post.status },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save news post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
