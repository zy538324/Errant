import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings";

export const MARKETING_CONSENT_VERSION = "2026-05-06-v2";
export const MARKETING_CONSENT_TEXT =
  "Tick this box if you would like Errant Arts to email you about news, events, new work, and offers. You can unsubscribe at any time.";

const TOKEN_VERSION = 1;

type RequestLike = Pick<Request, "headers" | "url">;

type RecordMarketingOptInInput = {
  customerId: string;
  email: string;
  source: "checkout" | "admin";
  orderId?: string | null;
  request?: RequestLike;
};

type CreateCampaignInput = {
  subject: string;
  previewText?: string | null;
  bodyText: string;
  createdById: string;
};

type UnsubscribeTokenPayload = {
  e: string;
  s: string;
  v: number;
};

export function normalizeMarketingEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function getRequestIpAddress(request?: RequestLike) {
  if (!request) {
    return null;
  }

  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

function getRequestUserAgent(request?: RequestLike) {
  return request?.headers.get("user-agent")?.slice(0, 500) ?? null;
}

function getMarketingSecret() {
  const envSecret = process.env.MARKETING_UNSUBSCRIBE_SECRET?.trim();
  if (envSecret) {
    return envSecret;
  }

  const settingsSecret = getAdminSettingsSnapshot().security.blobSigningSecret.trim();
  if (settingsSecret) {
    return settingsSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "development-only-marketing-secret";
  }

  throw new Error("Configure MARKETING_UNSUBSCRIBE_SECRET before sending marketing email.");
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signTokenBody(body: string) {
  return createHmac("sha256", getMarketingSecret()).update(body).digest("base64url");
}

export function createUnsubscribeToken(input: { subscriberId: string; email: string }) {
  const payload: UnsubscribeTokenPayload = {
    e: input.email,
    s: input.subscriberId,
    v: TOKEN_VERSION,
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${signTokenBody(body)}`;
}

function verifyUnsubscribeToken(token: string) {
  const [body, signature] = token.trim().split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = signTokenBody(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as UnsubscribeTokenPayload;
    if (payload.v !== TOKEN_VERSION || !payload.s || !normalizeMarketingEmail(payload.e)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getMarketingFromEmail() {
  return (
    process.env.MARKETING_FROM_EMAIL?.trim() ||
    process.env.MS_GRAPH_SENDER_EMAIL?.trim() ||
    "news@errant-arts.co.uk"
  ).toLowerCase();
}

export function getMarketingReplyToEmail() {
  return (
    process.env.MARKETING_REPLY_TO_EMAIL?.trim() ||
    process.env.MARKETING_FROM_EMAIL?.trim() ||
    process.env.MS_GRAPH_SENDER_EMAIL?.trim() ||
    "news@errant-arts.co.uk"
  ).toLowerCase();
}

export function getMarketingBaseUrl(requestUrl?: string) {
  const configured = getAdminSettingsSnapshot().app.appUrl.trim();
  if (configured) {
    return /^https?:\/\//i.test(configured) ? configured.replace(/\/+$/, "") : `https://${configured}`;
  }

  if (requestUrl) {
    try {
      return new URL(requestUrl).origin;
    } catch {
      return "https://errant-arts.co.uk";
    }
  }

  return "https://errant-arts.co.uk";
}

export function createUnsubscribeUrl(input: {
  subscriberId: string;
  email: string;
  requestUrl?: string;
}) {
  const token = createUnsubscribeToken({
    subscriberId: input.subscriberId,
    email: input.email,
  });
  return `${getMarketingBaseUrl(input.requestUrl)}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export async function recordMarketingOptIn({
  customerId,
  email,
  source,
  orderId,
  request,
}: RecordMarketingOptInInput) {
  const normalizedEmail = normalizeMarketingEmail(email);
  if (!normalizedEmail) {
    throw new Error("A valid email address is required for marketing consent.");
  }

  const now = new Date();
  const metadata = orderId ? { orderId } : undefined;

  return db.$transaction(async (tx) => {
    const subscriber = await tx.emailSubscriber.upsert({
      where: { email: normalizedEmail },
      update: {
        customerId,
        status: "SUBSCRIBED",
        consentSource: source,
        consentVersion: MARKETING_CONSENT_VERSION,
        consentText: MARKETING_CONSENT_TEXT,
        consentedAt: now,
        unsubscribedAt: null,
      },
      create: {
        email: normalizedEmail,
        customerId,
        status: "SUBSCRIBED",
        consentSource: source,
        consentVersion: MARKETING_CONSENT_VERSION,
        consentText: MARKETING_CONSENT_TEXT,
        consentedAt: now,
      },
    });

    await tx.marketingConsentEvent.create({
      data: {
        subscriberId: subscriber.id,
        customerId,
        email: normalizedEmail,
        eventType: "OPT_IN",
        source,
        consentVersion: MARKETING_CONSENT_VERSION,
        consentText: MARKETING_CONSENT_TEXT,
        ipAddress: getRequestIpAddress(request),
        userAgent: getRequestUserAgent(request),
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });

    await tx.customer.update({
      where: { id: customerId },
      data: {
        marketingConsent: true,
        consentAt: now,
      },
    });

    return subscriber;
  });
}

export async function unsubscribeMarketingSubscriber(token: string, request?: RequestLike) {
  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return { ok: false as const, reason: "invalid-token" };
  }

  const normalizedEmail = normalizeMarketingEmail(payload.e);
  if (!normalizedEmail) {
    return { ok: false as const, reason: "invalid-token" };
  }

  const now = new Date();

  const subscriber = await db.emailSubscriber.findFirst({
    where: {
      id: payload.s,
      email: normalizedEmail,
    },
  });

  if (!subscriber) {
    return { ok: false as const, reason: "not-found" };
  }

  await db.$transaction(async (tx) => {
    await tx.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: subscriber.unsubscribedAt ?? now,
      },
    });

    await tx.marketingConsentEvent.create({
      data: {
        subscriberId: subscriber.id,
        customerId: subscriber.customerId,
        email: subscriber.email,
        eventType: "UNSUBSCRIBE",
        source: "email-link",
        ipAddress: getRequestIpAddress(request),
        userAgent: getRequestUserAgent(request),
      },
    });

    if (subscriber.customerId) {
      await tx.customer.update({
        where: { id: subscriber.customerId },
        data: {
          marketingConsent: false,
          consentAt: null,
        },
      });
    }
  });

  return { ok: true as const, email: subscriber.email };
}

export async function getEligibleMarketingSubscribers() {
  return db.emailSubscriber.findMany({
    where: {
      status: "SUBSCRIBED",
      consentedAt: { not: null },
      unsubscribedAt: null,
    },
    orderBy: { consentedAt: "asc" },
  });
}

export async function getMarketingDashboard() {
  const [subscribedCount, unsubscribedCount, campaignCount, recentCampaigns] =
    await Promise.all([
      db.emailSubscriber.count({
        where: { status: "SUBSCRIBED", consentedAt: { not: null }, unsubscribedAt: null },
      }),
      db.emailSubscriber.count({
        where: { OR: [{ status: "UNSUBSCRIBED" }, { status: "SUPPRESSED" }] },
      }),
      db.marketingCampaign.count(),
      db.marketingCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          recipients: {
            select: { status: true },
          },
        },
      }),
    ]);

  return {
    subscribedCount,
    unsubscribedCount,
    campaignCount,
    recentCampaigns: recentCampaigns.map((campaign) => ({
      id: campaign.id,
      subject: campaign.subject,
      status: campaign.status,
      createdAt: campaign.createdAt.toISOString(),
      sentAt: campaign.sentAt?.toISOString() ?? null,
      total: campaign.recipients.length,
      sent: campaign.recipients.filter((recipient) => recipient.status === "SENT").length,
      failed: campaign.recipients.filter((recipient) => recipient.status === "FAILED").length,
      pending: campaign.recipients.filter((recipient) =>
        ["PENDING", "SENDING"].includes(recipient.status),
      ).length,
    })),
  };
}

export async function createMarketingCampaign({
  subject,
  previewText,
  bodyText,
  createdById,
}: CreateCampaignInput) {
  const normalizedSubject = subject.trim();
  const normalizedBody = bodyText.trim();
  if (!normalizedSubject || !normalizedBody) {
    throw new Error("A subject and message body are required.");
  }

  const subscribers = await getEligibleMarketingSubscribers();
  if (subscribers.length === 0) {
    throw new Error("There are no opted-in subscribers to send to.");
  }

  return db.marketingCampaign.create({
    data: {
      subject: normalizedSubject,
      previewText: previewText?.trim() || null,
      bodyText: normalizedBody,
      status: "DRAFT",
      fromEmail: getMarketingFromEmail(),
      replyToEmail: getMarketingReplyToEmail(),
      createdById,
      recipients: {
        create: subscribers.map((subscriber) => ({
          subscriberId: subscriber.id,
          email: subscriber.email,
        })),
      },
    },
    include: {
      recipients: true,
    },
  });
}

export async function getMarketingCampaignSummary(campaignId: string) {
  const campaign = await db.marketingCampaign.findUnique({
    where: { id: campaignId },
    include: {
      recipients: {
        select: { status: true },
      },
    },
  });

  if (!campaign) {
    return null;
  }

  const total = campaign.recipients.length;
  const sent = campaign.recipients.filter((recipient) => recipient.status === "SENT").length;
  const failed = campaign.recipients.filter((recipient) => recipient.status === "FAILED").length;
  const skipped = campaign.recipients.filter((recipient) => recipient.status === "SKIPPED").length;
  const pending = campaign.recipients.filter((recipient) =>
    ["PENDING", "SENDING"].includes(recipient.status),
  ).length;

  return {
    id: campaign.id,
    subject: campaign.subject,
    status: campaign.status,
    createdAt: campaign.createdAt.toISOString(),
    sentAt: campaign.sentAt?.toISOString() ?? null,
    total,
    sent,
    failed,
    skipped,
    pending,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderBodyHtml(bodyText: string) {
  return bodyText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

export function renderMarketingEmail(input: {
  bodyText: string;
  unsubscribeUrl: string;
}) {
  const replyTo = getMarketingReplyToEmail();
  const footerText = [
    "",
    "---",
    "You are receiving this because you opted in to email updates from Errant Arts.",
    `Unsubscribe: ${input.unsubscribeUrl}`,
    `You can also reply to ${replyTo} with "unsubscribe".`,
  ].join("\n");

  const html = [
    '<!doctype html><html><body style="margin:0;background:#f6f4ef;color:#171717;font-family:Arial,sans-serif;">',
    '<div style="max-width:680px;margin:0 auto;padding:32px 20px;">',
    '<div style="background:#ffffff;border:1px solid #dedbd2;padding:28px;">',
    renderBodyHtml(input.bodyText),
    '<hr style="border:none;border-top:1px solid #dedbd2;margin:28px 0;" />',
    '<p style="font-size:13px;line-height:1.6;color:#555;">',
    'You are receiving this because you opted in to email updates from Errant Arts.<br />',
    `<a href="${escapeHtml(input.unsubscribeUrl)}">Unsubscribe from these emails</a>`,
    `, or reply to ${escapeHtml(replyTo)} with "unsubscribe".`,
    "</p>",
    "</div>",
    "</div>",
    "</body></html>",
  ].join("");

  return {
    html,
    text: `${input.bodyText}${footerText}`,
  };
}
