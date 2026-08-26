import { z } from "zod";

const supportedUploadMimeTypes = new Set([
  "image/avif",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/tiff",
  "image/webp",
]);

const imageMimeTypeSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .refine((value) => supportedUploadMimeTypes.has(value), {
    message: "Only supported image uploads are allowed.",
  });

const optionalHostedPreviewUrlSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), {
      message: "Hosted preview URLs must use HTTPS.",
    })
    .optional(),
);

export const checkoutRequestSchema = z.object({
  artworkIds: z.array(z.string().min(1)).min(1).max(20),
  artworkSlugs: z.array(z.string().trim().min(1)).max(20).optional().default([]),
  artworkTitles: z.array(z.string().trim().min(1).max(300)).max(20).optional().default([]),
  acceptedLicence: z.literal(true),
  checkoutAttemptToken: z.string().trim().min(1),
  customerEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  marketingOptIn: z.boolean().optional().default(false),
});

export const marketingCampaignSchema = z.object({
  subject: z.string().trim().min(1).max(160),
  previewText: z.string().trim().max(240).optional().or(z.literal("")),
  bodyText: z.string().trim().min(1).max(20000),
});

export const marketingTestSendSchema = marketingCampaignSchema.extend({
  testEmail: z.string().trim().email().max(254),
});

export const uploadPresignSchema = z.object({
  collectionSlug: z.string().trim().min(1).max(120),
  filename: z.string().trim().min(1).max(200),
  contentType: imageMimeTypeSchema,
  bytes: z.number().int().positive().max(100 * 1024 * 1024),
});

export const artworkQuerySchema = z.object({
  collection: z.string().optional(),
  search: z.string().optional(),
  publishedOnly: z.coerce.boolean().optional().default(true),
});

export const createArtworkSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  collectionName: z.string().trim().min(1).max(160),
  collectionSlug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  category: z.string().trim().max(120).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  pricePence: z.number().int().nonnegative(),
  stockOnHand: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().trim().length(3).default("GBP"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  previewImageUrl: optionalHostedPreviewUrlSchema,
  widthPx: z.number().int().positive().optional(),
  heightPx: z.number().int().positive().optional(),
  uploads: z
    .array(
      z.object({
        storageKey: z.string().min(1),
        filename: z.string().trim().min(1).max(200),
        mimeType: imageMimeTypeSchema,
        bytes: z.number().int().positive(),
      })
    )
    .min(1),
});

export const blogPostMutationSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().min(1).max(500),
  content: z.string().trim().min(1).max(20000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export const adminSettingsSchema = z.object({
  app: z.object({
    appUrl: z.string().trim().default(""),
    supportEmail: z.string().trim().default(""),
    defaultCurrency: z.string().trim().min(3).max(3),
    maintenanceMode: z.boolean(),
    publicCatalogueEnabled: z.boolean(),
  }),
  stripe: z.object({
    secretKey: z.string().trim(),
    webhookSecret: z.string().trim(),
    priceCurrency: z.string().trim().min(3).max(10),
    automaticTax: z.boolean(),
  }),
  storage: z.object({
    r2Endpoint: z.string().trim().default(""),
    r2Bucket: z.string().trim().default(""),
    r2PublicBaseUrl: z.string().trim().default(""),
    r2AccessKeyId: z.string().trim(),
    r2SecretAccessKey: z.string().trim(),
    folderStrategy: z.enum(["collection-slug"]),
  }),
  security: z.object({
    blobSigningSecret: z.string().trim(),
    adminSessionHours: z.number().int().min(1).max(168),
    requireMfaForAdmins: z.boolean(),
    allowUsernameLoginOnly: z.boolean(),
  }),
  operations: z.object({
    retentionDays: z.number().int().min(1).max(3650),
    watermarkLabel: z.string().trim().min(1).max(120),
    enableCustomerExport: z.boolean(),
    enableCustomerAnonymisation: z.boolean(),
    notes: z.string().max(5000),
  }),
});

export type AdminSettings = z.infer<typeof adminSettingsSchema>;

export const adminLoginSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(8),
  token: z.string().trim().regex(/^\d{6}$/).optional(),
});
