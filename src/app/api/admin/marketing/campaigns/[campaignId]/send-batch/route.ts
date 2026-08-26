import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  createUnsubscribeUrl,
  getMarketingCampaignSummary,
  renderMarketingEmail,
} from "@/lib/marketing";
import { sendMicrosoft365Mail } from "@/lib/microsoft-graph-mail";

const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 5;

function getBatchSize() {
  const configured = Number(process.env.MARKETING_SEND_BATCH_SIZE ?? DEFAULT_BATCH_SIZE);
  if (!Number.isFinite(configured)) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.min(MAX_BATCH_SIZE, Math.max(1, Math.trunc(configured)));
}

async function finaliseCampaignIfComplete(campaignId: string) {
  const [pending, failed] = await Promise.all([
    db.marketingCampaignRecipient.count({
      where: { campaignId, status: { in: ["PENDING", "SENDING"] } },
    }),
    db.marketingCampaignRecipient.count({
      where: { campaignId, status: "FAILED" },
    }),
  ]);

  if (pending > 0) {
    return;
  }

  await db.marketingCampaign.update({
    where: { id: campaignId },
    data: {
      status: failed > 0 ? "FAILED" : "SENT",
      sentAt: new Date(),
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { campaignId } = await params;
    const campaign = await db.marketingCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    if (campaign.status === "SENT") {
      return NextResponse.json({
        campaign: await getMarketingCampaignSummary(campaign.id),
      });
    }

    const recipients = await db.marketingCampaignRecipient.findMany({
      where: { campaignId: campaign.id, status: "PENDING" },
      take: getBatchSize(),
      orderBy: { createdAt: "asc" },
      include: { subscriber: true },
    });

    if (recipients.length === 0) {
      await finaliseCampaignIfComplete(campaign.id);
      return NextResponse.json({
        campaign: await getMarketingCampaignSummary(campaign.id),
      });
    }

    await db.marketingCampaign.update({
      where: { id: campaign.id },
      data: { status: "SENDING" },
    });

    for (const recipient of recipients) {
      await db.marketingCampaignRecipient.update({
        where: { id: recipient.id },
        data: { status: "SENDING", error: null },
      });

      const subscriber = await db.emailSubscriber.findUnique({
        where: { id: recipient.subscriberId },
      });

      if (
        !subscriber ||
        subscriber.status !== "SUBSCRIBED" ||
        subscriber.unsubscribedAt ||
        !subscriber.consentedAt
      ) {
        await db.marketingCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "SKIPPED",
            error: "Subscriber is no longer eligible for marketing email.",
          },
        });
        continue;
      }

      const unsubscribeUrl = createUnsubscribeUrl({
        subscriberId: subscriber.id,
        email: subscriber.email,
        requestUrl: req.url,
      });
      const rendered = renderMarketingEmail({
        bodyText: campaign.bodyText,
        unsubscribeUrl,
      });

      try {
        const result = await sendMicrosoft365Mail({
          fromEmail: campaign.fromEmail,
          replyToEmail: campaign.replyToEmail,
          to: subscriber.email,
          subject: campaign.subject,
          html: rendered.html,
          text: rendered.text,
        });

        await db.marketingCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            messageId: result.requestId,
            error: null,
          },
        });
      } catch (error) {
        await db.marketingCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "FAILED",
            error: error instanceof Error ? error.message.slice(0, 1000) : "Send failed.",
          },
        });
      }
    }

    await finaliseCampaignIfComplete(campaign.id);

    await writeAuditLog({
      userId: admin.id,
      action: "marketing.campaign.send_batch",
      entityType: "MarketingCampaign",
      entityId: campaign.id,
      metadata: {
        batchSize: recipients.length,
      },
    });

    return NextResponse.json({
      campaign: await getMarketingCampaignSummary(campaign.id),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send marketing campaign.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
