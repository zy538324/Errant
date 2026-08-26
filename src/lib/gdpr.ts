import { db } from "@/lib/db";

export async function exportCustomerData(customerId: string) {
  return db.customer.findUnique({
    where: { id: customerId },
    include: {
      user: true,
      emailSubscriber: { include: { consentEvents: true } },
      consentEvents: true,
      orders: { include: { items: true, entitlements: true } },
      entitlements: true,
    },
  });
}

export async function anonymiseCustomerData(customerId: string) {
  return db.$transaction(async (tx: any) => {
    const now = new Date();
    const customer = await tx.customer.update({
      where: { id: customerId },
      data: {
        fullName: null,
        marketingConsent: false,
        consentAt: null,
      },
      include: { user: true },
    });

    await tx.emailSubscriber.updateMany({
      where: { customerId },
      data: {
        status: "SUPPRESSED",
        customerId: null,
        unsubscribedAt: now,
      },
    });

    await tx.user.update({
      where: { id: customer.userId },
      data: {
        email: `anonymised+${customer.id}@example.invalid`,
      },
    });

    return customer;
  });
}
