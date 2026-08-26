import { db } from "@/lib/db";

export async function getPublishedBlogPosts() {
  return db.blogPost.findMany({
    where: { status: "PUBLISHED" },
    include: { author: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function getPublishedBlogPostBySlug(slug: string) {
  return db.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { author: true },
  });
}

export async function getAdminBlogPosts() {
  return db.blogPost.findMany({
    include: { author: true },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export type PublishedBlogPost = Awaited<ReturnType<typeof getPublishedBlogPosts>>[number];
export type AdminBlogPost = Awaited<ReturnType<typeof getAdminBlogPosts>>[number];
