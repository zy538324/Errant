#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";

/**
 * Script: find-bad-storage-keys.ts
 *
 * Scans `ArtworkAsset.storageKey` for values that look like presigned PUT URLs
 * (contain `http`, `X-Amz-`, `cloudflarestorage` or similar). By default it
 * prints findings and suggested fixes. Run with `--apply` to perform updates.
 *
 * Usage:
 *   npx tsx scripts/find-bad-storage-keys.ts        # list
 *   npx tsx scripts/find-bad-storage-keys.ts --apply  # update detected keys
 */

const prisma = new PrismaClient();

function looksLikeUrl(value: string | null | undefined) {
  if (!value) return false;
  const lowered = value.toLowerCase();
  return (
    lowered.startsWith("http://") ||
    lowered.startsWith("https://") ||
    lowered.includes("x-amz-algorithm") ||
    lowered.includes("x-amz-credential") ||
    lowered.includes("cloudflarestorage") ||
    lowered.includes("amazonaws")
  );
}

async function main() {
  const apply = process.argv.includes("--apply") || process.argv.includes("--fix");

  console.log("Scanning artwork assets for suspicious storageKey values...");

  // fetch all assets and filter in JS to avoid Prisma null-check quirks
  const assets = await prisma.artworkAsset.findMany();

  const suspects = assets.filter((a) => looksLikeUrl(a.storageKey));

  if (suspects.length === 0) {
    console.log("No suspicious storageKey values found.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${suspects.length} suspicious storageKey(s):\n`);

  for (const asset of suspects) {
    const original = asset.storageKey as string;
    let parsedKey: string | null = null;

    try {
      const url = new URL(original);
      // typical R2 presigned PUT URL path: /<bucket>/<objectKey>
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        // remove the bucket segment
        parsedKey = parts.slice(1).join("/");
      } else if (parts.length === 1) {
        parsedKey = parts[0];
      }
    } catch (err) {
      // not a valid URL; leave parsedKey null
    }

    console.log(`Asset id: ${asset.id}`);
    console.log(`  current storageKey: ${original}`);
    if (parsedKey) {
      console.log(`  inferred objectKey: ${parsedKey}`);
      if (apply) {
        try {
          await prisma.artworkAsset.update({ where: { id: asset.id }, data: { storageKey: parsedKey } });
          console.log("  -> updated storageKey in database");
        } catch (err) {
          console.error("  -> failed to update:", err);
        }
      } else {
        console.log(`  -> run with --apply to update to: ${parsedKey}`);
      }
    } else {
      console.log("  -> unable to infer objectKey from URL; manual review required");
    }

    console.log("");
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect().catch(() => {});
  process.exit(1);
});
