import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth";
import { issueDownload } from "@/modules/downloads";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ entitlementId: string }> }
) {
  try {
    const customer = await requireCustomer();
    const { entitlementId } = await params;
    const download = await issueDownload(entitlementId, customer.id);
    return NextResponse.json(download);
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Download limit reached."
        ? "Download limit reached. Please contact support if you need help accessing your purchase."
        : error instanceof Error
          ? error.message
          : "Download unavailable.";
    const status = message === "Customer authentication is required."
      ? 401
      : message === "Forbidden." || message.startsWith("Download limit reached.")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
