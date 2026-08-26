import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentCustomerContext } from "@/lib/auth";
import { destroyCustomerSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function anonymisedEmail(userId: string) {
  return `deleted-${userId}@erased.errant-arts.local`;
}

function anonymisedUsername(userId: string) {
  return `deleted_${userId}`.slice(0, 64);
}

export async function POST() {
  try {
    const context = await getCurrentCustomerContext();

    if (!context) {
      return NextResponse.json(
        { error: "Customer authentication is required." },
        { status: 401 },
      );
    }

    const { user, customer } = context;
    const erasedEmail = anonymisedEmail(user.id);
    const erasedUsername = anonymisedUsername(user.id);

    await db.$transaction([
      db.session.deleteMany({ where: { userId: user.id } }),
      db.customer.update({
        where: { id: customer.id },
        data: {
          fullName: null,
          marketingConsent: false,
          consentAt: null,
          retentionLocked: true,
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: {
          email: erasedEmail,
          username: erasedUsername,
          passwordHash: null,
          mfaEnabled: false,
          mfaSecret: null,
        },
      }),
    ]);

    await destroyCustomerSession().catch(() => null);

    return NextResponse.json({
      success: true,
      message:
        "Your customer account has been anonymised. Order records are retained only where required for purchase, accounting, dispute, fraud-prevention or legal purposes.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process account erasure.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
