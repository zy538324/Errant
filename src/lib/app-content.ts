import "server-only";
import { db } from "@/lib/db";

export type OwnerSitePage = {
  id: string;
  key: string;
  title: string;
  eyebrow: string | null;
  intro: string | null;
  body: string | null;
  imageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  metadataJson: string;
  status: string;
  updatedAt: Date;
};

export type OwnerPortfolioItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  collectionName: string | null;
  collectionSlug: string | null;
  groupsJson: string;
  previewUrl: string | null;
  imageAlt: string | null;
  sortOrder: number;
  status: string;
  updatedAt: Date;
};

const previousPlaceholderPages = [
  { key: "home", title: "Home", eyebrow: "Errant Arts", intro: "Fine art, event and sports photography." },
  // Old placeholder about entry — triggers DB UPDATE to real content on next boot
  { key: "about", title: "About", eyebrow: "Artist profile", intro: "Tell visitors about the artist and the work." },
  { key: "shop", title: "Shop", eyebrow: "Digital gallery", intro: "Browse available licensed digital downloads." },
  { key: "portfolio", title: "Portfolio", eyebrow: "Selected work", intro: "Explore selected images by collection, subject and event." },
  { key: "contact", title: "Contact", eyebrow: "Get in touch", intro: "Use this page for enquiry and commission information." },
] as const;

const defaultPages = [
  {
    key: "home",
    title: "Fine Art & Sports Photography",
    eyebrow: "Errant-Arts",
    intro: "Original photography for people who want striking artwork from real places, real moments, and live sport. Buy selected images as licensed digital downloads, ready to enjoy after checkout.",
    body: null,
    imageUrl: "/logo-black-and-white.png",
    metadataJson: JSON.stringify({
      primaryLabel: "Shop digital downloads",
      primaryHref: "/shop",
      secondaryLabel: "View portfolio",
      secondaryHref: "/portfolio",
      showHeroLogo: true,
      heroLogoWidth: 500,
      heroLogoHeight: 333,
    }),
  },
  {
    key: "about",
    title: "A note from behind the lens.",
    eyebrow: "About",
    intro: "Errant-Arts is a personal photography practice shaped by place, light, and story.",
    body: "Using art to share my passions with the world\n\nErrant-Arts is about atmospheric landscapes, sacred architecture, and quiet images presented with the same care they receive behind the camera.\n\nHow each collection is built\n\nCollections are edited slowly and deliberately, with each image chosen to carry mood, memory, and a sense of place.",
    imageUrl: null,
    metadataJson: JSON.stringify({ signatureName: "Sean", location: "", adminManaged: true }),
  },
  {
    key: "shop",
    title: "Shop",
    eyebrow: "Digital gallery",
    intro: "Browse licensed digital downloads from the Errant Arts collection.",
    body: "Online purchases are currently for licensed digital downloads only.",
    imageUrl: null,
    metadataJson: JSON.stringify({
      gridEyebrow: "",
      gridTitle: "",
      gridDescription: "",
      emptyMessage: "",
    }),
  },
  {
    key: "portfolio",
    title: "Fine Art & Sports Photography",
    eyebrow: "Portfolio",
    intro: "Explore selected images by collection, subject, and event. When a piece is available to buy, it is sold as a licensed digital download.",
    body: null,
    imageUrl: null,
    metadataJson: JSON.stringify({ emptyMessage: "New portfolio work will appear here soon." }),
  },
  {
    key: "contact",
    title: "Contact",
    eyebrow: "Get in touch",
    intro: "For orders, licensing, commissions, or print enquiries, email the studio directly.",
    body: "Day-to-day updates also go out on the channels below.",
    imageUrl: null,
    metadataJson: JSON.stringify({ socialHeading: "Social media" }),
  },
] as const;

let ensured = false;

async function seedDefaultPages() {
  for (const page of defaultPages) {
    await db.$executeRawUnsafe(
      `INSERT INTO "SitePage" ("id", "key", "title", "eyebrow", "intro", "body", "imageUrl", "metadataJson")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT ("key") DO NOTHING`,
      page.key,
      page.title,
      page.eyebrow,
      page.intro,
      page.body,
      page.imageUrl,
      page.metadataJson,
    );
  }

  for (const previous of previousPlaceholderPages) {
    const current = defaultPages.find((page) => page.key === previous.key);
    if (!current) continue;

    await db.$executeRawUnsafe(
      `UPDATE "SitePage"
       SET "title" = $2,
           "eyebrow" = $3,
           "intro" = $4,
           "body" = $5,
           "imageUrl" = $6,
           "metadataJson" = $7,
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE "key" = $1
         AND "title" = $8
         AND COALESCE("eyebrow", '') = COALESCE($9, '')
         AND COALESCE("intro", '') = COALESCE($10, '')
         AND "body" IS NULL`,
      current.key,
      current.title,
      current.eyebrow,
      current.intro,
      current.body,
      current.imageUrl,
      current.metadataJson,
      previous.title,
      previous.eyebrow,
      previous.intro,
    );
  }
}

export async function ensureOwnerContentTables() {
  if (ensured) return;

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SitePage" (
      "id" TEXT PRIMARY KEY,
      "key" TEXT NOT NULL UNIQUE,
      "title" TEXT NOT NULL,
      "eyebrow" TEXT,
      "intro" TEXT,
      "body" TEXT,
      "imageUrl" TEXT,
      "seoTitle" TEXT,
      "seoDescription" TEXT,
      "metadataJson" TEXT NOT NULL DEFAULT '{}',
      "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
      "updatedById" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PortfolioItem" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "category" TEXT,
      "collectionName" TEXT,
      "collectionSlug" TEXT,
      "groupsJson" TEXT NOT NULL DEFAULT '[]',
      "previewUrl" TEXT,
      "imageAlt" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PortfolioItem_status_sortOrder_idx" ON "PortfolioItem" ("status", "sortOrder");`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PortfolioItem_collectionSlug_idx" ON "PortfolioItem" ("collectionSlug");`);

  await seedDefaultPages();
  ensured = true;
}

export async function listOwnerPages() {
  await ensureOwnerContentTables();
  return db.$queryRawUnsafe<OwnerSitePage[]>(`SELECT * FROM "SitePage" ORDER BY "key" ASC`);
}

export async function getOwnerPage(key: string) {
  await ensureOwnerContentTables();
  const rows = await db.$queryRawUnsafe<OwnerSitePage[]>(`SELECT * FROM "SitePage" WHERE "key" = $1 LIMIT 1`, key);
  return rows[0] ?? null;
}

export async function upsertOwnerPage(input: {
  key: string;
  title: string;
  eyebrow?: string | null;
  intro?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  metadataJson?: string;
  status?: string;
}) {
  await ensureOwnerContentTables();
  const rows = await db.$queryRawUnsafe<OwnerSitePage[]>(
    `INSERT INTO "SitePage" ("id", "key", "title", "eyebrow", "intro", "body", "imageUrl", "seoTitle", "seoDescription", "metadataJson", "status", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, '{}'), COALESCE($10, 'PUBLISHED'), CURRENT_TIMESTAMP)
     ON CONFLICT ("key") DO UPDATE SET
       "title" = EXCLUDED."title",
       "eyebrow" = EXCLUDED."eyebrow",
       "intro" = EXCLUDED."intro",
       "body" = EXCLUDED."body",
       "imageUrl" = EXCLUDED."imageUrl",
       "seoTitle" = EXCLUDED."seoTitle",
       "seoDescription" = EXCLUDED."seoDescription",
       "metadataJson" = EXCLUDED."metadataJson",
       "status" = EXCLUDED."status",
       "updatedAt" = CURRENT_TIMESTAMP
     RETURNING *`,
    input.key,
    input.title,
    input.eyebrow ?? null,
    input.intro ?? null,
    input.body ?? null,
    input.imageUrl ?? null,
    input.seoTitle ?? null,
    input.seoDescription ?? null,
    input.metadataJson ?? "{}",
    input.status ?? "PUBLISHED",
  );
  return rows[0];
}

export async function listOwnerPortfolioItems(options: { publishedOnly?: boolean } = {}) {
  await ensureOwnerContentTables();
  if (options.publishedOnly) {
    return db.$queryRawUnsafe<OwnerPortfolioItem[]>(`SELECT * FROM "PortfolioItem" WHERE "status" = 'PUBLISHED' ORDER BY "sortOrder" ASC, "updatedAt" DESC`);
  }
  return db.$queryRawUnsafe<OwnerPortfolioItem[]>(`SELECT * FROM "PortfolioItem" ORDER BY "sortOrder" ASC, "updatedAt" DESC`);
}

export async function getOwnerPortfolioItem(id: string) {
  await ensureOwnerContentTables();
  const rows = await db.$queryRawUnsafe<OwnerPortfolioItem[]>(`SELECT * FROM "PortfolioItem" WHERE "id" = $1 LIMIT 1`, id);
  return rows[0] ?? null;
}

export async function upsertOwnerPortfolioItem(input: {
  id?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  collectionName?: string | null;
  collectionSlug?: string | null;
  groupsJson?: string;
  previewUrl?: string | null;
  imageAlt?: string | null;
  sortOrder?: number;
  status?: string;
}) {
  await ensureOwnerContentTables();
  const id = input.id?.trim() || null;

  if (id) {
    const existingRows = await db.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "PortfolioItem" WHERE "id" = $1 LIMIT 1`,
      id,
    );

    if (existingRows[0]) {
      const rows = await db.$queryRawUnsafe<OwnerPortfolioItem[]>(
        `UPDATE "PortfolioItem"
         SET "title" = $2,
             "slug" = $3,
             "description" = $4,
             "category" = $5,
             "collectionName" = $6,
             "collectionSlug" = $7,
             "groupsJson" = COALESCE($8, '[]'),
             "previewUrl" = $9,
             "imageAlt" = $10,
             "sortOrder" = COALESCE($11, 0),
             "status" = COALESCE($12, 'DRAFT'),
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = $1
         RETURNING *`,
        id,
        input.title,
        input.slug,
        input.description ?? null,
        input.category ?? null,
        input.collectionName ?? null,
        input.collectionSlug ?? null,
        input.groupsJson ?? "[]",
        input.previewUrl ?? null,
        input.imageAlt ?? null,
        input.sortOrder ?? 0,
        input.status ?? "DRAFT",
      );
      return rows[0];
    }
  }

  const rows = await db.$queryRawUnsafe<OwnerPortfolioItem[]>(
    `INSERT INTO "PortfolioItem" ("id", "title", "slug", "description", "category", "collectionName", "collectionSlug", "groupsJson", "previewUrl", "imageAlt", "sortOrder", "status", "updatedAt")
     VALUES (COALESCE($1, gen_random_uuid()::text), $2, $3, $4, $5, $6, $7, COALESCE($8, '[]'), $9, $10, COALESCE($11, 0), COALESCE($12, 'DRAFT'), CURRENT_TIMESTAMP)
     ON CONFLICT ("slug") DO UPDATE SET
       "title" = EXCLUDED."title",
       "description" = EXCLUDED."description",
       "category" = EXCLUDED."category",
       "collectionName" = EXCLUDED."collectionName",
       "collectionSlug" = EXCLUDED."collectionSlug",
       "groupsJson" = EXCLUDED."groupsJson",
       "previewUrl" = EXCLUDED."previewUrl",
       "imageAlt" = EXCLUDED."imageAlt",
       "sortOrder" = EXCLUDED."sortOrder",
       "status" = EXCLUDED."status",
       "updatedAt" = CURRENT_TIMESTAMP
     RETURNING *`,
    id,
    input.title,
    input.slug,
    input.description ?? null,
    input.category ?? null,
    input.collectionName ?? null,
    input.collectionSlug ?? null,
    input.groupsJson ?? "[]",
    input.previewUrl ?? null,
    input.imageAlt ?? null,
    input.sortOrder ?? 0,
    input.status ?? "DRAFT",
  );
  return rows[0];
}

export async function deleteOwnerPortfolioItem(id: string) {
  await ensureOwnerContentTables();
  await db.$executeRawUnsafe(`DELETE FROM "PortfolioItem" WHERE "id" = $1`, id);
}
