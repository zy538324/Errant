import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { exportCustomerData } from "@/modules/customers";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { customerId } = await params;
    const data = await exportCustomerData(customerId);
    await writeAuditLog({
      userId: admin.id,
      action: "customer.export",
      entityType: "Customer",
      entityId: customerId,
    });
    return NextResponse.json({ customer: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export customer data.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
