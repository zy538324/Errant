import { prisma } from '../lib/prisma';
import { regenerateWatermarkedPreview } from '../lib/watermark';
import fs from 'fs';

async function main() {
  const artworks = await prisma.artwork.findMany();

  for (const art of artworks) {
    try {
      const previewExists = await regenerateWatermarkedPreview(art.id, art.originalUrl);
      if (previewExists) {
        await prisma.artwork.update({
          where: { id: art.id },
          data: { previewUrl: previewExists },
        });
        console.log(`✅ Preview regenerated for ${art.title}`);
      } else {
        console.warn(`⚠️ Failed to regenerate preview for ${art.title}`);
      }
    } catch (err) {
      console.error(`❌ Error processing ${art.title}:`, err);
    }
  }

  console.log('Preview regeneration complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });