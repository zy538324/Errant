const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node scripts/get-asset.js <assetId>');
    process.exit(1);
  }

  try {
    const asset = await prisma.artworkAsset.findUnique({ where: { id }, include: { artwork: true } });
    if (!asset) {
      console.log('Asset not found');
    } else {
      console.log('id:', asset.id);
      console.log('storageKey:', asset.storageKey);
      console.log('artworkId:', asset.artworkId);
      console.log('artwork title:', asset.artwork?.title);
    }
  } catch (err) {
    console.error('DB error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
