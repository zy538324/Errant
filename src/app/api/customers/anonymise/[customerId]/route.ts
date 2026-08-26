import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { anonymiseCustomerData } from "@/modules/customers";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { customerId } = await params;
    const customer = await anonymiseCustomerData(customerId);
    await writeAuditLog({
      userId: admin.id,
      action: "customer.anonymise",
      entityType: "Customer",
      entityId: customerId,
    });
    return NextResponse.json({ customer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to anonymise customer.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
