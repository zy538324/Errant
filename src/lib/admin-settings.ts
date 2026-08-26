import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { adminSettingsSchema, type AdminSettings } from "@/lib/validators";

const SETTINGS_FILE = path.join(homedir(), ".errant-arts", "admin-settings.json");
const LEGACY_SETTINGS_FILE = path.join(process.cwd(), ".codex-config", "admin-settings.json");

export type AdminSecretStatus = {
  stripeSecretKeyConfigured: boolean;
  stripeWebhookSecretConfigured: boolean;
  r2AccessKeyIdConfigured: boolean;
  r2SecretAccessKeyConfigured: boolean;
  blobSigningSecretConfigured: boolean;
};

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function getDefaultSettings(): AdminSettings {
  return {
    app: {
      appUrl: process.env.APP_URL ?? "https://errant-arts.co.uk",
      supportEmail: process.env.SUPPORT_EMAIL ?? "contact@errant-arts.co.uk",
      defaultCurrency: (process.env.STRIPE_PRICE_CURRENCY ?? "gbp").toUpperCase(),
      maintenanceMode: false,
      publicCatalogueEnabled: true,
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY ?? "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
      priceCurrency: (process.env.STRIPE_PRICE_CURRENCY ?? "gbp").toLowerCase(),
      automaticTax: true,
    },
    storage: {
      r2Endpoint: process.env.R2_ENDPOINT ?? "https://2c991ae448fe54d9153489400a814531.eu.r2.cloudflarestorage.com",
      r2Bucket: process.env.R2_BUCKET ?? "errant-arts",
      r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? "https://pub-6b53eec07e464d068053143a90fad267.r2.dev",
      r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      folderStrategy: "collection-slug",
    },
    security: {
      blobSigningSecret: process.env.BLOB_SIGNING_SECRET ?? "",
      adminSessionHours: 12,
      requireMfaForAdmins: true,
      allowUsernameLoginOnly: true,
    },
    operations: {
      retentionDays: 365,
      watermarkLabel: "Errant-Arts preview",
      enableCustomerExport: true,
      enableCustomerAnonymisation: true,
      notes: "",
    },
  };
}

function applyDeploymentEnvOverrides(settings: AdminSettings): AdminSettings {
  return {
    ...settings,
    app: {
      ...settings.app,
      appUrl: envValue("APP_URL") ?? settings.app.appUrl,
      supportEmail: envValue("SUPPORT_EMAIL") ?? settings.app.supportEmail,
      defaultCurrency:
        envValue("STRIPE_PRICE_CURRENCY")?.toUpperCase() ??
        settings.app.defaultCurrency,
    },
    stripe: {
      ...settings.stripe,
      secretKey: envValue("STRIPE_SECRET_KEY") ?? settings.stripe.secretKey,
      webhookSecret:
        envValue("STRIPE_WEBHOOK_SECRET") ?? settings.stripe.webhookSecret,
      priceCurrency:
        envValue("STRIPE_PRICE_CURRENCY")?.toLowerCase() ??
        settings.stripe.priceCurrency,
    },
    storage: {
      ...settings.storage,
      r2Endpoint: envValue("R2_ENDPOINT") ?? settings.storage.r2Endpoint,
      r2Bucket: envValue("R2_BUCKET") ?? settings.storage.r2Bucket,
      r2PublicBaseUrl:
        envValue("R2_PUBLIC_BASE_URL") ?? settings.storage.r2PublicBaseUrl,
      r2AccessKeyId:
        envValue("R2_ACCESS_KEY_ID") ?? settings.storage.r2AccessKeyId,
      r2SecretAccessKey:
        envValue("R2_SECRET_ACCESS_KEY") ?? settings.storage.r2SecretAccessKey,
    },
    security: {
      ...settings.security,
      blobSigningSecret:
        envValue("BLOB_SIGNING_SECRET") ?? settings.security.blobSigningSecret,
    },
  };
}

function mergeSettings(overrides: Partial<AdminSettings> | undefined): AdminSettings {
  const defaults = getDefaultSettings();
  const merged = overrides
    ? {
        app: { ...defaults.app, ...overrides.app },
        stripe: { ...defaults.stripe, ...overrides.stripe },
        storage: { ...defaults.storage, ...overrides.storage },
        security: { ...defaults.security, ...overrides.security },
        operations: { ...defaults.operations, ...overrides.operations },
      }
    : defaults;

  return applyDeploymentEnvOverrides(merged);
}

function readStoredSettingsSync(): Partial<AdminSettings> | undefined {
  for (const file of [SETTINGS_FILE, LEGACY_SETTINGS_FILE]) {
    if (!existsSync(file)) {
      continue;
    }

    try {
      return JSON.parse(readFileSync(file, "utf8")) as Partial<AdminSettings>;
    } catch {
      continue;
    }
  }

  return undefined;
}

async function readStoredSettings(): Promise<Partial<AdminSettings> | undefined> {
  for (const file of [SETTINGS_FILE, LEGACY_SETTINGS_FILE]) {
    try {
      const raw = await readFile(file, "utf8");
      return JSON.parse(raw) as Partial<AdminSettings>;
    } catch {
      continue;
    }
  }

  return undefined;
}

function preserveSecret(nextValue: string, previousValue: string | undefined) {
  return nextValue.trim() ? nextValue : previousValue ?? "";
}

function mergeSecretFields(
  input: AdminSettings,
  existing: Partial<AdminSettings> | undefined,
): AdminSettings {
  return {
    ...input,
    stripe: {
      ...input.stripe,
      secretKey: preserveSecret(input.stripe.secretKey, existing?.stripe?.secretKey),
      webhookSecret: preserveSecret(
        input.stripe.webhookSecret,
        existing?.stripe?.webhookSecret,
      ),
    },
    storage: {
      ...input.storage,
      r2AccessKeyId: preserveSecret(
        input.storage.r2AccessKeyId,
        existing?.storage?.r2AccessKeyId,
      ),
      r2SecretAccessKey: preserveSecret(
        input.storage.r2SecretAccessKey,
        existing?.storage?.r2SecretAccessKey,
      ),
    },
    security: {
      ...input.security,
      blobSigningSecret: preserveSecret(
        input.security.blobSigningSecret,
        existing?.security?.blobSigningSecret,
      ),
    },
  };
}

export function sanitizeAdminSettingsForClient(settings: AdminSettings): AdminSettings {
  return {
    ...settings,
    stripe: {
      ...settings.stripe,
      secretKey: "",
      webhookSecret: "",
    },
    storage: {
      ...settings.storage,
      r2AccessKeyId: "",
      r2SecretAccessKey: "",
    },
    security: {
      ...settings.security,
      blobSigningSecret: "",
    },
  };
}

export function getAdminSecretStatus(settings: AdminSettings): AdminSecretStatus {
  return {
    stripeSecretKeyConfigured: Boolean(settings.stripe.secretKey.trim()),
    stripeWebhookSecretConfigured: Boolean(settings.stripe.webhookSecret.trim()),
    r2AccessKeyIdConfigured: Boolean(settings.storage.r2AccessKeyId.trim()),
    r2SecretAccessKeyConfigured: Boolean(settings.storage.r2SecretAccessKey.trim()),
    blobSigningSecretConfigured: Boolean(settings.security.blobSigningSecret.trim()),
  };
}

export function getAdminSettingsSnapshot(): AdminSettings {
  return adminSettingsSchema.parse(mergeSettings(readStoredSettingsSync()));
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const stored = await readStoredSettings();
  return adminSettingsSchema.parse(mergeSettings(stored));
}

export async function getAdminSettingsForClient(): Promise<{
  settings: AdminSettings;
  secretStatus: AdminSecretStatus;
}> {
  const settings = await getAdminSettings();
  return {
    settings: sanitizeAdminSettingsForClient(settings),
    secretStatus: getAdminSecretStatus(settings),
  };
}

export async function saveAdminSettings(input: AdminSettings): Promise<AdminSettings> {
  const existing = await readStoredSettings();
  const parsed = applyDeploymentEnvOverrides(
    mergeSecretFields(adminSettingsSchema.parse(input), existing),
  );
  await mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
  await writeFile(SETTINGS_FILE, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return parsed;
}
