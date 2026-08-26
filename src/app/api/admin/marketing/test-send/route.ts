import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  getMarketingBaseUrl,
  getMarketingFromEmail,
  getMarketingReplyToEmail,
  renderMarketingEmail,
} from "@/lib/marketing";
import { sendMicrosoft365Mail } from "@/lib/microsoft-graph-mail";
import { marketingTestSendSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const payload = marketingTestSendSchema.parse(await req.json());
    const unsubscribeUrl = `${getMarketingBaseUrl(req.url)}/unsubscribe`;
    const rendered = renderMarketingEmail({
      bodyText: payload.bodyText,
      unsubscribeUrl,
    });

    await sendMicrosoft365Mail({
      fromEmail: getMarketingFromEmail(),
      replyToEmail: getMarketingReplyToEmail(),
      to: payload.testEmail,
      subject: `[Test] ${payload.subject}`,
      html: rendered.html,
      text: rendered.text,
    });

    await writeAuditLog({
      userId: admin.id,
      action: "marketing.campaign.test_send",
      entityType: "MarketingCampaign",
      entityId: "test",
      metadata: {
        subject: payload.subject,
        testEmail: payload.testEmail,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send marketing test email.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
