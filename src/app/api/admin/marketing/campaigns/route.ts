import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  createMarketingCampaign,
  getMarketingCampaignSummary,
} from "@/lib/marketing";
import { marketingCampaignSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const payload = marketingCampaignSchema.parse(await req.json());
    const campaign = await createMarketingCampaign({
      subject: payload.subject,
      previewText: payload.previewText,
      bodyText: payload.bodyText,
      createdById: admin.id,
    });
    const summary = await getMarketingCampaignSummary(campaign.id);

    await writeAuditLog({
      userId: admin.id,
      action: "marketing.campaign.create",
      entityType: "MarketingCampaign",
      entityId: campaign.id,
      metadata: {
        subject: campaign.subject,
        recipients: campaign.recipients.length,
      },
    });

    return NextResponse.json({ campaign: summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create marketing campaign.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
