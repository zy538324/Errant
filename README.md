# Errant-Arts

A gallery-grade e-commerce platform for fine art photography with protected previews,
Stripe-secured digital downloads, Sanity Studio content management, and private Cloudflare R2 file delivery.

Built with Next.js 15 (App Router) + TypeScript + Prisma + Neon Postgres + Cloudflare R2 + Stripe + Sanity.
The app is configured for Vercel-hosted production deployment.

---

## What It Does

1. Protected public gallery: every image is served through a signed preview route, with
   time-limited URLs and no raw storage keys exposed in page markup.
2. Secure digital checkout: Stripe Checkout handles payment, and successful purchases create
   download entitlements with capped download counts.
3. Signed download delivery: `/api/downloads/[entitlementId]` issues short-lived R2 URLs and
   increments the download counter atomically.
4. Studio-managed catalogue: Sanity Studio is used for photo details, customer-friendly uploads,
   SEO fields, reviews and content management.
5. Digital-download-only storefront: online checkout currently sells licensed digital downloads.

---

## Local Development

The app can be run locally with:

```bash
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

---

## Vercel Deployment

```bash
npm install
npm run build
npm run vercel:deploy:prod
```

Provide environment variables for:
- Stripe
- Sanity
- Cloudflare R2
- image/download signing secrets
- Neon Postgres connection strings:
  - `DATABASE_URL`
  - `DATABASE_URL_UNPOOLED`, if used for direct schema operations

Example Neon URLs:

```bash
DATABASE_URL="postgresql://user:password@pooler-host:5432/dbname?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@direct-host:5432/dbname?sslmode=require"
```

### Storage and image processing

- Cloudflare R2 stores private high-resolution customer download files.
- Sanity stores public content and generated website preview images.
- The preview and watermark routes use `sharp` and are intended to run in the Vercel Node runtime.
- Run `npm run prisma:migrate` once against Neon before first production checkout traffic.

### Microsoft 365 / Graph email

Customer login codes and marketing campaigns are sent through Microsoft Graph
using `POST /users/{sender}/sendMail` rather than Resend or SMTP. Configure an
Entra app registration with Microsoft Graph application permission `Mail.Send`
and grant admin consent. The app uses the client credentials flow with
`https://graph.microsoft.com/.default`.

Required environment variables:

- `MS_GRAPH_TENANT_ID`
- `MS_GRAPH_CLIENT_ID`
- `MS_GRAPH_CLIENT_SECRET`
- `MS_GRAPH_SENDER_EMAIL`
- `MARKETING_FROM_EMAIL`
- `MARKETING_REPLY_TO_EMAIL`
- `MS_GRAPH_TRANSACTIONAL_SENDER_EMAIL` or `CUSTOMER_LOGIN_EMAIL_FROM`
- `CUSTOMER_LOGIN_REPLY_TO`

For least-privilege production setup, scope the Graph app to only the approved
sender mailbox or mailboxes using Exchange Online application RBAC, or the
legacy Application Access Policy where that is still the tenant standard.
Marketing sends are intentionally one message per opted-in subscriber so each
email has a private unsubscribe token and failures are tracked per recipient.

---

## Data Model

```text
User -1:1- Customer -1:* - Order -1:* - OrderItem -*:1- Artwork
                      \-*:*- DownloadEntitlement
Artwork -*:1- Collection
Artwork -1:* - ArtworkAsset
BlogPost, AuditLog, Session
```

Enum-like values are stored as `TEXT` strings and validated at the application layer
(`src/lib/enums.ts`) to keep the schema portable across hosting environments.

---

## Security Posture

- Previews: HMAC-signed URLs with short TTLs and allowed-host validation.
- Downloads: AES-256-GCM encrypted storage-key tokens with short TTLs and capped download counts.
- Admin: bcrypt password hashing, TOTP MFA, strict cookies, and brute-force rate limiting.
- CSP: strict default-src/self posture with Stripe-specific allowances where needed.
- Payments: no card data touches the app server; Stripe Checkout + signed webhooks only.

---

## Content Sources

- Primary content management: Sanity Studio at `/studio`
- Digital download storage: Cloudflare R2
- Checkout/order records: Neon Postgres through Prisma

### Sanity -> Stripe/Checkout Sync

If you want pricing/stock changes made in Sanity to flow into checkout automatically:

1. Set `SANITY_WEBHOOK_SECRET` in your app environment.
2. Add a Sanity webhook that POSTs to `/api/sanity/artwork-sync`.
3. Include a header `x-sanity-webhook-secret: <SANITY_WEBHOOK_SECRET>`.
4. Use a projection body that includes:
   - `slug.current` as `slug`
   - `shopArtworkId` (optional)
   - `title`
   - `description`
   - `category`
   - `collectionSlug`
   - `pricePence`
   - `currency`
   - `stockOnHand`
   - `isPublished`

Checkout always enforces the Prisma inventory/price snapshot at order creation time.
Checkout also performs an on-demand Sanity slug sync before creating Stripe line items,
so newly published Sanity artworks become purchasable without manual DB seeding.

### Studio shop image uploads

For sale artwork, use the Studio field labelled **Upload shop image here**. That
single upload stores the full-resolution customer download in private Cloudflare
R2 and creates the watermarked Sanity preview used by the public site.

The advanced preview fields are only visible after the R2 download file exists.
If older artwork has a Sanity preview image but no R2 download file, use
`/admin/migrations/sanity-images` to backfill those records into R2.
