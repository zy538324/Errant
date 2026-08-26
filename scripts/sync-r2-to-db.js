#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const JimpModule = require('jimp');
const Jimp = JimpModule.Jimp || JimpModule.default || JimpModule;
const sharp = require('sharp');

function loadEnv(envPath) {
  const raw = fs.readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)=(?:"([^"]*)"|'([^']*)'|(.*))\s*$/i);
    if (m) out[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return out;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function getBufferPromise(image, mime) {
  return new Promise((resolve, reject) => {
    try {
      image.getBuffer(mime, (err, buf) => {
        if (err) return reject(err);
        resolve(buf);
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const env = loadEnv(path.join(process.cwd(), '.env'));
  const endpoint = env.R2_ENDPOINT;
  const bucket = env.R2_BUCKET;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    console.error('Missing R2 config in .env');
    process.exit(1);
  }

  const client = new S3Client({ region: 'auto', endpoint, forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });
  const prisma = new PrismaClient();

  const targetSlug = argv[0] || null; // if provided, sync only that collection

  try {
    // Discover collection prefixes under 'collections/'
    const prefixesRes = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'collections/', Delimiter: '/' }));
    const prefixes = (prefixesRes.CommonPrefixes || []).map((p) => p.Prefix.replace(/^collections\//, '').replace(/\/$/, ''));
    const toProcess = targetSlug ? prefixes.filter((p) => p === targetSlug) : prefixes;

    for (const slug of toProcess) {
      console.log('Syncing collection:', slug);
      // Ensure collection exists in DB
      const col = await prisma.collection.upsert({ where: { slug }, update: {}, create: { name: slug.replace(/-/g, ' '), slug } });

      // List all objects under prefix
      const prefix = `collections/${slug}/`;
      let continuation = undefined;
      const r2Items = [];
      do {
        const res = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuation }));
        for (const it of res.Contents || []) {
          if (!it.Key) continue;
          // skip folders
          if (it.Key.endsWith('/')) continue;
          r2Items.push({ key: it.Key, size: it.Size || 0, lastModified: it.LastModified ? it.LastModified.toISOString() : null });
        }
        continuation = res.IsTruncated ? res.NextContinuationToken : undefined;
      } while (continuation);

      // For each R2 item, ensure DB has an Artwork and an ArtworkAsset for it
      const existingAssets = await prisma.artworkAsset.findMany({ where: { storageKey: { in: r2Items.map((i) => i.key) } }, include: { artwork: true } });
      const existingKeys = new Set(existingAssets.map((a) => a.storageKey));

      for (const item of r2Items) {
        const existing = await prisma.artworkAsset.findUnique({ where: { storageKey: item.key }, include: { artwork: true } });

        if (!existing) {
          // Create artwork entry for this image
          const base = path.basename(item.key).replace(/\.[^.]+$/, '');
          let artSlug = slugify(base);
          // ensure unique
          let counter = 1;
          while (await prisma.artwork.findUnique({ where: { slug: artSlug } })) {
            artSlug = `${slugify(base)}-${counter++}`;
          }

          const artwork = await prisma.artwork.create({ data: { title: base, slug: artSlug, status: 'PUBLISHED', pricePence: 0, tags: [], currency: 'GBP', collectionId: col.id } });

          // Create original asset row
          const mime = /\.(jpe?g)$/i.test(item.key) ? 'image/jpeg' : /\.png$/i.test(item.key) ? 'image/png' : 'application/octet-stream';
          await prisma.artworkAsset.create({ data: { artworkId: artwork.id, kind: 'ORIGINAL', storageKey: item.key, mimeType: mime, bytes: item.size, checksum: null } });

          // Generate thumbnail: fetch object, resize, upload to R2 under thumbs/
          try {
            const getRes = await client.send(new GetObjectCommand({ Bucket: bucket, Key: item.key }));
            const bodyBuf = await streamToBuffer(getRes.Body);
            const meta = await sharp(bodyBuf).metadata().catch(() => ({}));
            const targetW = Math.min(meta.width || 800, 800);
            const targetH = meta.width && meta.height ? Math.round((meta.height / meta.width) * targetW) : 800;
            const thumbBuf = await sharp(bodyBuf).resize({ width: targetW, height: targetH, fit: 'inside' }).jpeg({ quality: 80 }).toBuffer();
            const thumbKey = `collections/${slug}/thumbs/${path.basename(item.key).replace(/\.[^.]+$/, '')}-thumb.jpg`;
            await client.send(new PutObjectCommand({ Bucket: bucket, Key: thumbKey, Body: thumbBuf, ContentType: 'image/jpeg' }));
            await prisma.artworkAsset.create({ data: { artworkId: artwork.id, kind: 'PREVIEW', storageKey: thumbKey, mimeType: 'image/jpeg', bytes: thumbBuf.length, checksum: null } });
            console.log('Added artwork and thumbnail for', item.key);
          } catch (err) {
            console.error('Thumbnail generation/upload failed for', item.key);
            if (err && err.stack) console.error(err.stack);
            else console.error(err);
          }
        } else {
          // asset exists; ensure a PREVIEW exists for this artwork
          const previewExists = await prisma.artworkAsset.findFirst({ where: { artworkId: existing.artworkId, kind: 'PREVIEW' } });
          if (!previewExists) {
            try {
              const getRes = await client.send(new GetObjectCommand({ Bucket: bucket, Key: item.key }));
              const bodyBuf = await streamToBuffer(getRes.Body);
              const meta = await sharp(bodyBuf).metadata().catch(() => ({}));
              const targetW = Math.min(meta.width || 800, 800);
              const targetH = meta.width && meta.height ? Math.round((meta.height / meta.width) * targetW) : 800;
              const thumbBuf = await sharp(bodyBuf).resize({ width: targetW, height: targetH, fit: 'inside' }).jpeg({ quality: 80 }).toBuffer();
              const thumbKey = `collections/${slug}/thumbs/${path.basename(item.key).replace(/\.[^.]+$/, '')}-thumb.jpg`;
              await client.send(new PutObjectCommand({ Bucket: bucket, Key: thumbKey, Body: thumbBuf, ContentType: 'image/jpeg' }));
              await prisma.artworkAsset.create({ data: { artworkId: existing.artworkId, kind: 'PREVIEW', storageKey: thumbKey, mimeType: 'image/jpeg', bytes: thumbBuf.length, checksum: null } });
              console.log('Generated missing preview for', item.key);
            } catch (err) {
              console.error('Thumbnail generation/upload failed for', item.key);
              if (err && err.stack) console.error(err.stack);
              else console.error(err);
            }
          }
        }
      }

      // Re-list objects to include any thumbs we just uploaded, then remove DB assets that no longer exist in R2
      const freshRes = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
      const freshKeys = new Set((freshRes.Contents || []).map((i) => i.Key));
      const dbAssetsInCollection = await prisma.artworkAsset.findMany({ where: { storageKey: { startsWith: `collections/${slug}/` } }, include: { artwork: true } });
      for (const asset of dbAssetsInCollection) {
        if (!freshKeys.has(asset.storageKey)) {
          console.log('Removing DB asset for missing R2 key:', asset.storageKey);
          await prisma.artworkAsset.delete({ where: { id: asset.id } });
          // if artwork now has zero assets, delete artwork as well
          const remaining = await prisma.artworkAsset.count({ where: { artworkId: asset.artworkId } });
          if (remaining === 0) {
            console.log('Deleting artwork with no assets:', asset.artworkId);
            await prisma.artwork.delete({ where: { id: asset.artworkId } });
          }
        }
      }
    }
  } catch (err) {
    console.error('Sync failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
