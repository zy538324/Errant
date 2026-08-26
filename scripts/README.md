# Scripts

This folder contains helper scripts for diagnosing and repairing data related to Cloudflare R2 uploads.

- `r2-cors.json` — example CORS configuration to apply to your R2 bucket (restrict origins in production).
- `find-bad-storage-keys.ts` — scans `ArtworkAsset.storageKey` for values that look like presigned PUT URLs and optionally updates them to the inferred object key.

Usage examples:

List suspicious storage keys:

```bash
npx tsx scripts/find-bad-storage-keys.ts
```

Apply inferred fixes (updates DB):

```bash
npx tsx scripts/find-bad-storage-keys.ts --apply
```

Apply the CORS config to your R2 bucket (replace placeholders):

```bash
# save r2-cors.json locally then run
aws s3api put-bucket-cors --bucket YOUR_BUCKET_NAME --cors-configuration file://scripts/r2-cors.json --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com --region auto
```
