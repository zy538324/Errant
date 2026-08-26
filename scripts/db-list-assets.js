const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const assets = await prisma.artworkAsset.findMany({
      where: { storageKey: { startsWith: 'collections/Rugby-Test/' } },
      include: { artwork: true },
    });
    console.log(JSON.stringify(assets, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
