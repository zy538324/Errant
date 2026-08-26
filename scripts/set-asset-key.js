const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const id = process.argv[2];
  const newKey = process.argv[3];
  if (!id || !newKey) {
    console.error('Usage: node scripts/set-asset-key.js <assetId> <newStorageKey>');
    process.exit(1);
  }

  try {
    const updated = await prisma.artworkAsset.update({ where: { id }, data: { storageKey: newKey } });
    console.log('Updated asset:', updated.id, '->', updated.storageKey);
  } catch (err) {
    console.error('Error updating asset:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
