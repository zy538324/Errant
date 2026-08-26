"use client";

import { useState } from "react";
import { Download, Mail, RefreshCw, Send, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type CampaignSummary = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  total: number;
  sent: number;
  failed: number;
  skipped?: number;
  pending: number;
};

type MarketingDashboard = {
  subscribedCount: number;
  unsubscribedCount: number;
  campaignCount: number;
  recentCampaigns: CampaignSummary[];
  graph: {
    configured: boolean;
    tenantIdConfigured: boolean;
    clientIdConfigured: boolean;
    clientSecretConfigured: boolean;
    senderEmail: string;
    replyToEmail: string;
  };
};

type MarketingManagerProps = {
  initialDashboard: MarketingDashboard;
};

const SEND_BATCH_DELAY_MS = 10000;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not sent";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.error ?? "Request failed.");
  }
  return payload;
}

export function MarketingManager({ initialDashboard }: MarketingManagerProps) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [testEmail, setTestEmail] = useState(initialDashboard.graph.senderEmail);
  const [activeCampaign, setActiveCampaign] = useState<CampaignSummary | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const graphReady = dashboard.graph.configured;
  const campaignLocked = Boolean(activeCampaign && activeCampaign.pending > 0);

  async function refreshDashboard() {
    const response = await fetch("/api/admin/marketing/dashboard", {
      cache: "no-store",
    });
    const nextDashboard = await readJsonResponse<MarketingDashboard>(response);
    setDashboard(nextDashboard);
  }

  async function prepareCampaign() {
    setBusy("prepare");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject, previewText, bodyText }),
      });
      const payload = await readJsonResponse<{ campaign: CampaignSummary }>(response);
      setActiveCampaign(payload.campaign);
      setMessage(`Campaign prepared for ${payload.campaign.total} opted-in subscribers.`);
      await refreshDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to prepare campaign.");
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    setBusy("test");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/marketing/test-send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject, previewText, bodyText, testEmail }),
      });
      await readJsonResponse<{ ok: true }>(response);
      setMessage(`Test sent to ${testEmail}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send test.");
    } finally {
      setBusy(null);
    }
  }

  async function sendCampaign() {
    if (!activeCampaign) {
      return;
    }

    setBusy("send");
    setMessage("Sending campaign in privacy-safe batches...");
    try {
      let current = activeCampaign;
      do {
        const response = await fetch(
          `/api/admin/marketing/campaigns/${current.id}/send-batch`,
          { method: "POST" },
        );
        const payload = await readJsonResponse<{ campaign: CampaignSummary }>(response);
        current = payload.campaign;
        setActiveCampaign(current);
        setMessage(
          `Sent ${current.sent} of ${current.total}. Failed ${current.failed}. Skipped ${
            current.skipped ?? 0
          }.`,
        );
        await refreshDashboard();
        if (current.pending > 0) {
          await sleep(SEND_BATCH_DELAY_MS);
        }
      } while (current.pending > 0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send campaign.");
    } finally {
      setBusy(null);
    }
  }

  function resetComposer() {
    setActiveCampaign(null);
    setSubject("");
    setPreviewText("");
    setBodyText("");
    setMessage(null);
  }

  return (
    <div className="mt-10 space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3 text-stone-100">
            <Users className="h-5 w-5 text-brand-accent" />
            Subscribers
          </div>
          <div className="mt-3 font-serif text-4xl text-stone-50">
            {dashboard.subscribedCount}
          </div>
          <div className="mt-1 text-sm text-stone-400">
            opted in and not unsubscribed
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3 text-stone-100">
            <ShieldCheck className="h-5 w-5 text-brand-accent" />
            Suppressed
          </div>
          <div className="mt-3 font-serif text-4xl text-stone-50">
            {dashboard.unsubscribedCount}
          </div>
          <div className="mt-1 text-sm text-stone-400">
            excluded from every send
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3 text-stone-100">
            <Mail className="h-5 w-5 text-brand-accent" />
            Microsoft Graph
          </div>
          <div className="mt-3 text-sm text-stone-300">
            {graphReady ? "Configured" : "Needs configuration"}
          </div>
          <div className="mt-2 text-xs leading-6 text-stone-500">
            Sender: {dashboard.graph.senderEmail}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-stone-400">
            Campaign composer
          </div>
          <div className="mt-5 grid gap-4">
            <label className="block text-sm text-stone-300">
              Subject
              <input
                value={subject}
                disabled={campaignLocked}
                onChange={(event) => setSubject(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-white/30 disabled:opacity-60"
              />
            </label>
            <label className="block text-sm text-stone-300">
              Preview text
              <input
                value={previewText}
                disabled={campaignLocked}
                onChange={(event) => setPreviewText(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-white/30 disabled:opacity-60"
              />
            </label>
            <label className="block text-sm text-stone-300">
              Email message
              <textarea
                value={bodyText}
                disabled={campaignLocked}
                onChange={(event) => setBodyText(event.target.value)}
                rows={12}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-white/30 disabled:opacity-60"
              />
            </label>
            <label className="block text-sm text-stone-300">
              Test recipient
              <input
                type="email"
                value={testEmail}
                onChange={(event) => setTestEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-white/30"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={Boolean(busy) || !graphReady || !subject.trim() || !bodyText.trim()}
              onClick={() => void sendTest()}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send test
            </Button>
            <Button
              type="button"
              disabled={Boolean(busy) || !subject.trim() || !bodyText.trim() || campaignLocked}
              onClick={() => void prepareCampaign()}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Prepare campaign
            </Button>
            <Button
              type="button"
              disabled={Boolean(busy) || !graphReady || !activeCampaign || activeCampaign.pending === 0}
              onClick={() => void sendCampaign()}
            >
              <Send className="mr-2 h-4 w-4" />
              Send to list
            </Button>
            <Button type="button" variant="ghost" disabled={Boolean(busy)} onClick={resetComposer}>
              <RefreshCw className="mr-2 h-4 w-4" />
              New draft
            </Button>
          </div>

          {message ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-300">
              {message}
            </div>
          ) : null}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-stone-400">
            Compliance tools
          </div>
          <div className="mt-5 space-y-4 text-sm leading-7 text-stone-300">
            <p>
              Campaigns use the opted-in subscriber list only. Unsubscribed and
              suppressed addresses are excluded before every batch.
            </p>
            <p>
              Each recipient receives a private email with an individual
              unsubscribe link. The app does not use a shared BCC list for
              campaign sends.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/admin/marketing/subscribers/export"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-stone-100 transition-colors hover:bg-white/5"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </a>
            <Button type="button" variant="ghost" onClick={() => void refreshDashboard()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {activeCampaign ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-stone-300">
              <div className="font-medium text-stone-100">{activeCampaign.subject}</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>Total: {activeCampaign.total}</div>
                <div>Pending: {activeCampaign.pending}</div>
                <div>Sent: {activeCampaign.sent}</div>
                <div>Failed: {activeCampaign.failed}</div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="text-xs uppercase tracking-[0.3em] text-stone-400">
          Recent campaigns
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.2em] text-stone-500">
              <tr>
                <th className="py-3 pr-4">Subject</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Recipients</th>
                <th className="py-3 pr-4">Sent</th>
                <th className="py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-stone-300">
              {dashboard.recentCampaigns.length > 0 ? (
                dashboard.recentCampaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="py-4 pr-4 text-stone-100">{campaign.subject}</td>
                    <td className="py-4 pr-4">{campaign.status}</td>
                    <td className="py-4 pr-4">{campaign.total}</td>
                    <td className="py-4 pr-4">
                      {campaign.sent}
                      {campaign.failed > 0 ? ` (${campaign.failed} failed)` : ""}
                    </td>
                    <td className="py-4">{formatDate(campaign.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-5 text-stone-400" colSpan={5}>
                    No campaigns created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
