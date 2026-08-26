import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getMarketingDashboard,
  getMarketingFromEmail,
  getMarketingReplyToEmail,
} from "@/lib/marketing";
import { getGraphMailStatus } from "@/lib/microsoft-graph-mail";

export async function GET() {
  try {
    await requireAdmin();
    const dashboard = await getMarketingDashboard();
    return NextResponse.json({
      ...dashboard,
      graph: getGraphMailStatus({
        senderEmail: getMarketingFromEmail(),
        replyToEmail: getMarketingReplyToEmail(),
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load marketing dashboard.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
