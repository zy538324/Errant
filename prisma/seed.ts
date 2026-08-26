import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { db, closeClient } from "../src/lib/db";

type SeedAdmin = { username: string; email: string; password: string };

function getSeedAdminUsers(): SeedAdmin[] {
  if (process.env.SEED_ADMIN_USERS_JSON) {
    return JSON.parse(process.env.SEED_ADMIN_USERS_JSON) as SeedAdmin[];
  }

  const generated = randomBytes(18).toString("base64url");
  const password = process.env.SEED_ADMIN_PASSWORD?.trim() || generated;

  if (!process.env.SEED_ADMIN_PASSWORD?.trim()) {
    console.log(
      `[seed] No SEED_ADMIN_PASSWORD supplied. Generated one-time password for "admin": ${generated}`,
    );
  }

  return [
    {
      username: process.env.SEED_ADMIN_USERNAME ?? "admin",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@errant-arts.local",
      password,
    },
  ];
}

type DemoArtwork = {
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  pricePence: number;
  previewUrl: string;
};

// Demo artworks use Sanity-hosted CDN URLs seen on the live errant-arts.co.uk site.
// The storefront will wrap each URL through /api/protected-image which applies the
// signed watermark overlay before delivering any bytes to the client.
const DEMO_ARTWORKS: DemoArtwork[] = [
  {
    title: "Deep Massage Tattoo",
    slug: "deep-massage-tattoo",
    description:
      "Moody editorial portrait. Inked shoulders under diffused studio light — part of the 'Portraits' edit.",
    category: "Portrait",
    tags: ["portrait", "editorial", "studio"],
    pricePence: 1000,
    previewUrl:
      "https://cdn.sanity.io/images/ap75fu72/production/3e76bf976bbebf9ffa589278b93e5bf4b3835c24-5699x3799.jpg",
  },
  {
    title: "Line-up The Lineout",
    slug: "line-up-the-lineout",
    description:
      "The split-second before contact in the lineout. Grain, tension and the scent of wet grass.",
    category: "Rugby",
    tags: ["rugby", "sport", "action"],
    pricePence: 1600,
    previewUrl:
      "https://cdn.sanity.io/images/ap75fu72/production/983b9ae1113fbda87847c52ac7ecf349771ad7c9-2199x3262.jpg",
  },
  {
    title: "She's Got The Look",
    slug: "she-s-got-the-look",
    description: "A quiet, confident expression caught between frames of a shoot.",
    category: "Portrait",
    tags: ["portrait", "fashion"],
    pricePence: 1000,
    previewUrl:
      "https://cdn.sanity.io/images/ap75fu72/production/8a038d97e08b95d8a9bd88112f65ee4c178dcc85-1290x1938.jpg",
  },
  {
    title: "Out In The Sunshine",
    slug: "out-in-the-sunshine",
    description: "Warm backlit field portrait — natural light, no retouching.",
    category: "Portrait",
    tags: ["portrait", "natural-light"],
    pricePence: 1000,
    previewUrl:
      "https://cdn.sanity.io/images/ap75fu72/production/d7504df590a5fba5ae4a8ad2ee0b2b0881d0eea3-2903x3584.jpg",
  },
  {
    title: "Painting The Lines",
    slug: "painting-the-lines",
    description: "Early-morning groundsman marking the pitch before kick-off.",
    category: "Rugby",
    tags: ["rugby", "groundskeeping", "documentary"],
    pricePence: 1600,
    previewUrl:
      "https://cdn.sanity.io/images/ap75fu72/production/cd63672262f3c0cbe8dad79a8aee11ca07509630-4000x5027.jpg",
  },
  {
    title: "How Cheeky!",
    slug: "how-cheeky",
    description: "A candid, cheeky moment from the sidelines — because rugby is fun.",
    category: "Rugby",
    tags: ["rugby", "candid"],
    pricePence: 1000,
    previewUrl:
      "https://cdn.sanity.io/images/ap75fu72/production/2cf71ba14941172b39f2c2932907e0b56972a72-5959x3980.jpg",
  },
];

async function main() {
  const adminUsers = getSeedAdminUsers();
  const seededAdmins: { id: string; username: string }[] = [];

  try {
    for (const admin of adminUsers) {
      const passwordHash = await bcrypt.hash(admin.password, 12);
      const mfaSecret = authenticator.generateSecret();

      const user = await db.user.upsert({
        where: { username: admin.username },
        update: {
          email: admin.email.toLowerCase(),
          passwordHash,
          role: "ADMIN",
          mfaEnabled: false,
          mfaSecret,
        },
        create: {
          username: admin.username,
          email: admin.email.toLowerCase(),
          passwordHash,
          role: "ADMIN",
          mfaEnabled: false,
          mfaSecret,
        },
      });
      seededAdmins.push({ id: user.id, username: user.username });
    }

    const portraits = await db.collection.upsert({
      where: { slug: "portraits" },
      update: { name: "Portraits", description: "Studio and natural-light portrait work." },
      create: {
        name: "Portraits",
        slug: "portraits",
        description: "Studio and natural-light portrait work.",
      },
    });

    const rugby = await db.collection.upsert({
      where: { slug: "rugby" },
      update: { name: "Rugby", description: "Terrace-level rugby photography." },
      create: {
        name: "Rugby",
        slug: "rugby",
        description: "Terrace-level rugby photography.",
      },
    });

    for (const demo of DEMO_ARTWORKS) {
      const collectionId = demo.category === "Rugby" ? rugby.id : portraits.id;
      await db.artwork.upsert({
        where: { slug: demo.slug },
        update: {
          title: demo.title,
          description: demo.description,
          status: "PUBLISHED",
          category: demo.category,
          tagsJson: JSON.stringify(demo.tags),
          pricePence: demo.pricePence,
          currency: "GBP",
          collectionId,
          previewUrl: demo.previewUrl,
        },
        create: {
          title: demo.title,
          slug: demo.slug,
          description: demo.description,
          status: "PUBLISHED",
          category: demo.category,
          tagsJson: JSON.stringify(demo.tags),
          pricePence: demo.pricePence,
          currency: "GBP",
          collectionId,
          previewUrl: demo.previewUrl,
        },
      });
    }

    // Seed a demo Print-on-Demand product catalogue.
    await db.printProduct.upsert({
      where: { providerSku: "FRAMED-POSTER-16X20" },
      update: {},
      create: {
        providerSku: "FRAMED-POSTER-16X20",
        provider: "printful",
        name: "Framed fine art poster",
        description: "Premium matte poster in black wooden frame, museum-quality paper.",
        basePencePrice: 7500,
        variantsJson: JSON.stringify([
          { label: "12×16 / Black frame", size: "12x16", pricePence: 6500, providerVariantId: "pf_12x16_black" },
          { label: "16×20 / Black frame", size: "16x20", pricePence: 7500, providerVariantId: "pf_16x20_black" },
          { label: "18×24 / Black frame", size: "18x24", pricePence: 9500, providerVariantId: "pf_18x24_black" },
        ]),
      },
    });

    await db.printProduct.upsert({
      where: { providerSku: "CANVAS-24X36" },
      update: {},
      create: {
        providerSku: "CANVAS-24X36",
        provider: "printful",
        name: "Gallery-wrap canvas",
        description: "1.5\" gallery-wrap stretched canvas, UV-protective finish.",
        basePencePrice: 11500,
        variantsJson: JSON.stringify([
          { label: "16×20 gallery wrap", size: "16x20", pricePence: 9500, providerVariantId: "pf_c_16x20" },
          { label: "24×36 gallery wrap", size: "24x36", pricePence: 11500, providerVariantId: "pf_c_24x36" },
        ]),
      },
    });

    // Demo blog posts.
    const posts = [
      {
        title: "Rebuilding Errant-Arts on Cloudflare",
        slug: "rebuilding-on-cloudflare",
        excerpt: "Why the studio moved from AWS Amplify to Cloudflare Workers and R2.",
        content:
          "This rebuild focuses on three things: speed, privacy, and operational simplicity. Cloudflare's Workers + D1 + R2 stack removes the AWS VPC overhead, gives us edge-rendered pages, and keeps the original image files fully private until a paid entitlement is created.",
        status: "PUBLISHED" as const,
        publishedAt: new Date(),
      },
      {
        title: "Preparing the next collection edit",
        slug: "preparing-the-next-collection-edit",
        excerpt: "Draft planning notes for upcoming curation work.",
        content:
          "A placeholder draft for the new studio admin workflow. Refine in /admin/news.",
        status: "DRAFT" as const,
        publishedAt: null,
      },
    ];

    for (const [index, post] of posts.entries()) {
      const authorId = seededAdmins[index % seededAdmins.length].id;
      await db.blogPost.upsert({
        where: { slug: post.slug },
        update: {
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          status: post.status,
          publishedAt: post.publishedAt,
          authorId,
        },
        create: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          status: post.status,
          publishedAt: post.publishedAt,
          authorId,
        },
      });
    }

    console.log(`[seed] complete. Admin users: ${seededAdmins.map((u) => u.username).join(", ")}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await closeClient();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
