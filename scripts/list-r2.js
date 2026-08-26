const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

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

async function listBucket() {
  const env = loadEnv(path.join(process.cwd(), '.env'));
  const endpoint = env.R2_ENDPOINT;
  const bucket = env.R2_BUCKET;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    console.error('Missing R2 configuration in .env');
    process.exit(1);
  }

  const client = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    let continuation = undefined;
    console.log(`Listing objects in bucket ${bucket} at ${endpoint}`);
    do {
      const command = new ListObjectsV2Command({ Bucket: bucket, Prefix: '', ContinuationToken: continuation });
      const res = await client.send(command);
      const items = res.Contents || [];
      for (const item of items) {
        console.log(item.Key, item.Size, item.LastModified);
      }
      continuation = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuation);
  } catch (err) {
    console.error('Error listing bucket:', err);
    process.exit(1);
  }
}

listBucket();
