import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { getEligibleMarketingSubscribers } from "@/lib/marketing";

function csvCell(value: string | null | undefined) {
  const normalized = value ?? "";
  return `"${normalized.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    const subscribers = await getEligibleMarketingSubscribers();
    const rows = [
      ["email", "consentedAt", "consentSource", "consentVersion"].map(csvCell).join(","),
      ...subscribers.map((subscriber) =>
        [
          subscriber.email,
          subscriber.consentedAt?.toISOString() ?? "",
          subscriber.consentSource ?? "",
          subscriber.consentVersion ?? "",
        ]
          .map(csvCell)
          .join(","),
      ),
    ].join("\n");

    await writeAuditLog({
      userId: admin.id,
      action: "marketing.subscribers.export",
      entityType: "EmailSubscriber",
      entityId: "eligible",
      metadata: {
        subscribers: subscribers.length,
      },
    });

    return new NextResponse(`${rows}\n`, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="errant-arts-marketing-subscribers.csv"',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to export marketing subscribers.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
