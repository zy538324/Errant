"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminSecretStatus } from "@/lib/admin-settings";
import type { AdminSettings } from "@/lib/validators";

type SettingsEditorProps = {
  initialSettings: AdminSettings;
  initialSecretStatus: AdminSecretStatus;
};

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.3em] text-stone-400">{eyebrow}</div>
      <h2 className="mt-3 font-serif text-3xl text-stone-50">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300">{body}</p>
    </div>
  );
}

export function SettingsEditor({ initialSettings, initialSecretStatus }: SettingsEditorProps) {
  const [settings, setSettings] = useState<AdminSettings>(initialSettings);
  const [secretStatus, setSecretStatus] = useState<AdminSecretStatus>(initialSecretStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveSettings() {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save settings.");
      }

      setSettings(result.settings);
      if (result.secretStatus) {
        setSecretStatus(result.secretStatus);
      }
      setMessage("Settings saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-10 space-y-8">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <SectionTitle
            eyebrow="Application"
            title="Runtime identity"
            body="Control the primary site URL, support contact, catalogue visibility, and operational maintenance posture."
          />
          <div className="mt-6 grid gap-4">
            <label className="block text-sm text-stone-300">
              App URL
              <input value={settings.app.appUrl} onChange={(event) => setSettings((current) => ({ ...current, app: { ...current.app, appUrl: event.target.value } }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <label className="block text-sm text-stone-300">
              Support email
              <input value={settings.app.supportEmail} onChange={(event) => setSettings((current) => ({ ...current, app: { ...current.app, supportEmail: event.target.value } }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <label className="block text-sm text-stone-300">
              Default currency
              <input value={settings.app.defaultCurrency} onChange={(event) => setSettings((current) => ({ ...current, app: { ...current.app, defaultCurrency: event.target.value.toUpperCase() } }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-200">
                Public catalogue enabled
                <input type="checkbox" checked={settings.app.publicCatalogueEnabled} onChange={(event) => setSettings((current) => ({ ...current, app: { ...current.app, publicCatalogueEnabled: event.target.checked } }))} />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-200">
                Maintenance mode
                <input type="checkbox" checked={settings.app.maintenanceMode} onChange={(event) => setSettings((current) => ({ ...current, app: { ...current.app, maintenanceMode: event.target.checked } }))} />
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <SectionTitle
            eyebrow="Security"
            title="Admin and signing controls"
            body="Set admin session duration, enforce MFA posture, and manage signing material used across uploads and secured operations."
          />
          <div className="mt-6 grid gap-4">
            <label className="block text-sm text-stone-300">
              Blob signing secret
              <input value={settings.security.blobSigningSecret} onChange={(event) => setSettings((current) => ({ ...current, security: { ...current.security, blobSigningSecret: event.target.value } }))} type="password" placeholder={secretStatus.blobSigningSecretConfigured ? "Configured. Leave blank to keep current secret." : "Paste a signing secret"} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <label className="block text-sm text-stone-300">
              Admin session duration (hours)
              <input value={settings.security.adminSessionHours} onChange={(event) => setSettings((current) => ({ ...current, security: { ...current.security, adminSessionHours: Number(event.target.value || 0) } }))} type="number" min={1} max={168} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-200">
                Require MFA for admins
                <input type="checkbox" checked={settings.security.requireMfaForAdmins} onChange={(event) => setSettings((current) => ({ ...current, security: { ...current.security, requireMfaForAdmins: event.target.checked } }))} />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-200">
                Username-only login
                <input type="checkbox" checked={settings.security.allowUsernameLoginOnly} onChange={(event) => setSettings((current) => ({ ...current, security: { ...current.security, allowUsernameLoginOnly: event.target.checked } }))} />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <SectionTitle
            eyebrow="Stripe"
            title="Payments and checkout"
            body="Configure the live Stripe credentials and checkout behaviour used by the store’s order and fulfilment flows."
          />
          <div className="mt-6 grid gap-4">
            <label className="block text-sm text-stone-300">
              Stripe secret key
              <input value={settings.stripe.secretKey} onChange={(event) => setSettings((current) => ({ ...current, stripe: { ...current.stripe, secretKey: event.target.value } }))} type="password" placeholder={secretStatus.stripeSecretKeyConfigured ? "Configured. Leave blank to keep current key." : "Paste a Stripe secret key"} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <label className="block text-sm text-stone-300">
              Webhook signing secret
              <input value={settings.stripe.webhookSecret} onChange={(event) => setSettings((current) => ({ ...current, stripe: { ...current.stripe, webhookSecret: event.target.value } }))} type="password" placeholder={secretStatus.stripeWebhookSecretConfigured ? "Configured. Leave blank to keep current secret." : "Paste a Stripe webhook secret"} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <label className="block text-sm text-stone-300">
              Price currency
              <input value={settings.stripe.priceCurrency} onChange={(event) => setSettings((current) => ({ ...current, stripe: { ...current.stripe, priceCurrency: event.target.value.toLowerCase() } }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-200">
              Enable automatic tax
              <input type="checkbox" checked={settings.stripe.automaticTax} onChange={(event) => setSettings((current) => ({ ...current, stripe: { ...current.stripe, automaticTax: event.target.checked } }))} />
            </label>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <SectionTitle
            eyebrow="Storage"
            title="Cloudflare R2 control plane"
            body="Manage the active R2 endpoint, bucket, public base URL, and API keys that drive catalogue uploads, previews, and downloads."
          />
          <div className="mt-6 grid gap-4">
            <label className="block text-sm text-stone-300">
              R2 endpoint
              <input value={settings.storage.r2Endpoint} onChange={(event) => setSettings((current) => ({ ...current, storage: { ...current.storage, r2Endpoint: event.target.value } }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <label className="block text-sm text-stone-300">
              R2 bucket
              <input value={settings.storage.r2Bucket} onChange={(event) => setSettings((current) => ({ ...current, storage: { ...current.storage, r2Bucket: event.target.value } }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <label className="block text-sm text-stone-300">
              R2 public base URL
              <input value={settings.storage.r2PublicBaseUrl} onChange={(event) => setSettings((current) => ({ ...current, storage: { ...current.storage, r2PublicBaseUrl: event.target.value } }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <label className="block text-sm text-stone-300">
              R2 access key ID
              <input value={settings.storage.r2AccessKeyId} onChange={(event) => setSettings((current) => ({ ...current, storage: { ...current.storage, r2AccessKeyId: event.target.value } }))} placeholder={secretStatus.r2AccessKeyIdConfigured ? "Configured. Leave blank to keep current key." : "Paste an R2 access key ID"} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <label className="block text-sm text-stone-300">
              R2 secret access key
              <input value={settings.storage.r2SecretAccessKey} onChange={(event) => setSettings((current) => ({ ...current, storage: { ...current.storage, r2SecretAccessKey: event.target.value } }))} type="password" placeholder={secretStatus.r2SecretAccessKeyConfigured ? "Configured. Leave blank to keep current key." : "Paste an R2 secret access key"} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-300">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">Folder strategy</div>
              <div className="mt-2 text-stone-100">Collections write into <code>collections/&lt;slug&gt;/originals/</code>.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <SectionTitle
            eyebrow="Operations"
            title="Retention, export, and handling"
            body="Tune customer-data export/anonymisation controls, retention defaults, watermark labelling, and operator notes for the studio."
          />
          <div className="mt-6 grid gap-4">
            <label className="block text-sm text-stone-300">
              Retention days
              <input value={settings.operations.retentionDays} onChange={(event) => setSettings((current) => ({ ...current, operations: { ...current.operations, retentionDays: Number(event.target.value || 0) } }))} type="number" min={1} max={3650} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <label className="block text-sm text-stone-300">
              Watermark label
              <input value={settings.operations.watermarkLabel} onChange={(event) => setSettings((current) => ({ ...current, operations: { ...current.operations, watermarkLabel: event.target.value } }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-200">
                Enable customer export
                <input type="checkbox" checked={settings.operations.enableCustomerExport} onChange={(event) => setSettings((current) => ({ ...current, operations: { ...current.operations, enableCustomerExport: event.target.checked } }))} />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-200">
                Enable anonymisation
                <input type="checkbox" checked={settings.operations.enableCustomerAnonymisation} onChange={(event) => setSettings((current) => ({ ...current, operations: { ...current.operations, enableCustomerAnonymisation: event.target.checked } }))} />
              </label>
            </div>
            <label className="block text-sm text-stone-300">
              Operator notes
              <textarea value={settings.operations.notes} onChange={(event) => setSettings((current) => ({ ...current, operations: { ...current.operations, notes: event.target.value } }))} rows={6} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none" />
            </label>
          </div>
        </div>

        <aside className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 text-stone-300">
          <SectionTitle
            eyebrow="Control room"
            title="Operational summary"
            body="A high-level snapshot of the currently active runtime configuration for payments, storage, sessions, and customer handling."
          />
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">Payments</div>
              <div className="mt-2 text-stone-100">Currency: {settings.stripe.priceCurrency.toUpperCase()}</div>
              <div className="mt-1 text-sm text-stone-400">Automatic tax: {settings.stripe.automaticTax ? "Enabled" : "Disabled"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">Storage</div>
              <div className="mt-2 break-all text-stone-100">{settings.storage.r2Bucket}</div>
              <div className="mt-1 break-all text-sm text-stone-400">{settings.storage.r2PublicBaseUrl}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">Sessions</div>
              <div className="mt-2 text-stone-100">{settings.security.adminSessionHours} hour admin session</div>
              <div className="mt-1 text-sm text-stone-400">MFA required: {settings.security.requireMfaForAdmins ? "Yes" : "No"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">Data operations</div>
              <div className="mt-2 text-stone-100">Retention: {settings.operations.retentionDays} days</div>
              <div className="mt-1 text-sm text-stone-400">Export/anonymisation: {settings.operations.enableCustomerExport && settings.operations.enableCustomerAnonymisation ? "Enabled" : "Restricted"}</div>
            </div>
          </div>
        </aside>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={saveSettings} disabled={saving}>{saving ? "Saving settings..." : "Save settings"}</Button>
        {message && <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-200">{message}</div>}
      </div>
    </div>
  );
}
