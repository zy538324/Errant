import type { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { requireStripe } from "@/lib/stripe";
import {
  CHECKOUT_EXPIRED_MESSAGE,
  CHECKOUT_EXPIRY_SECONDS,
  getCheckoutAttemptExpiryFromSessionMetadata,
  hasCheckoutAttemptExpired,
} from "@/lib/checkout-expiry";

type OrderWithItems = {
  id: string;
  customerId: string;
  status: string;
  stripeCheckoutId: string | null;
  stripePaymentIntentId: string | null;
  items: Array<{
    artworkId: string;
    kind: string;
  }>;
};

function getPaymentIntentId(
  paymentIntent: string | Stripe.PaymentIntent | null | undefined,
) {
  if (typeof paymentIntent === "string") {
    return paymentIntent;
  }

  return paymentIntent?.id ?? null;
}

async function ensureDigitalDownloadEntitlements(
  tx: Prisma.TransactionClient,
  order: OrderWithItems,
) {
  for (const item of order.items) {
    if (item.kind !== "digital") {
      continue;
    }

    await tx.downloadEntitlement.upsert({
      where: {
        id: `${order.id}:${item.artworkId}`,
      },
      update: {},
      create: {
        id: `${order.id}:${item.artworkId}`,
        customerId: order.customerId,
        orderId: order.id,
        artworkId: item.artworkId,
        maxDownloads: 5,
      },
    });
  }
}

export async function markOrderPaid(
  orderId: string,
  paymentIntentId?: string | null,
  checkoutSessionId?: string | null,
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "PAID" || order.status === "FULFILLED") {
      const data: Prisma.OrderUpdateInput = {};
      if (paymentIntentId && !order.stripePaymentIntentId) {
        data.stripePaymentIntentId = paymentIntentId;
      }
      if (checkoutSessionId && !order.stripeCheckoutId) {
        data.stripeCheckoutId = checkoutSessionId;
      }

      if (Object.keys(data).length > 0) {
        await tx.order.update({
          where: { id: order.id },
          data,
        });
      }

      await ensureDigitalDownloadEntitlements(tx, order);
      return order;
    }

    if (order.status !== "PENDING") {
      throw new Error(`Order cannot be marked as paid from status ${order.status}.`);
    }

    const data: Prisma.OrderUpdateInput = {
      status: "PAID",
    };
    if (paymentIntentId) {
      data.stripePaymentIntentId = paymentIntentId;
    }
    if (checkoutSessionId && !order.stripeCheckoutId) {
      data.stripeCheckoutId = checkoutSessionId;
    }

    const paidOrder = await tx.order.update({
      where: { id: order.id },
      data,
      include: { items: true },
    });

    await ensureDigitalDownloadEntitlements(tx, paidOrder);

    return paidOrder;
  });
}

function getCheckoutSessionOrderId(session: Stripe.Checkout.Session) {
  return session.metadata?.orderId?.trim() || null;
}

function getOrderCheckoutExpiry(order: { createdAt: Date }) {
  return Math.floor(order.createdAt.getTime() / 1000) + CHECKOUT_EXPIRY_SECONDS;
}

function getCheckoutExpiryForOrder(
  session: Stripe.Checkout.Session,
  order: { createdAt: Date },
) {
  return getCheckoutAttemptExpiryFromSessionMetadata(session.metadata) ?? getOrderCheckoutExpiry(order);
}

async function resolveCheckoutSessionOrderId(session: Stripe.Checkout.Session) {
  const metadataOrderId = getCheckoutSessionOrderId(session);
  if (metadataOrderId) {
    return metadataOrderId;
  }

  return (
    (
      await db.order.findUnique({
        where: { stripeCheckoutId: session.id },
        select: { id: true },
      })
    )?.id ?? null
  );
}

export async function markCheckoutSessionPaid(session: Stripe.Checkout.Session) {
  const orderId = await resolveCheckoutSessionOrderId(session);
  if (!orderId) {
    throw new Error("Missing orderId.");
  }

  if (session.payment_status !== "paid") {
    throw new Error("Checkout session is not paid.");
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true, createdAt: true },
  });
  if (
    order &&
    order.status !== "PAID" &&
    order.status !== "FULFILLED" &&
    hasCheckoutAttemptExpired(getCheckoutExpiryForOrder(session, order))
  ) {
    await releasePendingOrder(orderId);
    throw new Error(CHECKOUT_EXPIRED_MESSAGE);
  }

  return markOrderPaid(
    orderId,
    getPaymentIntentId(session.payment_intent),
    session.id,
  );
}

export async function releaseExpiredCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = await resolveCheckoutSessionOrderId(session);

  if (!orderId) {
    throw new Error("Missing orderId.");
  }

  return releasePendingOrder(orderId);
}

export async function releasePendingOrder(orderId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status !== "PENDING") {
      return order;
    }

    for (const item of order.items) {
      const artwork = await tx.artwork.findUnique({
        where: { id: item.artworkId },
        select: { stockOnHand: true },
      });

      if (!artwork || typeof artwork.stockOnHand !== "number") {
        continue;
      }

      await tx.artwork.update({
        where: { id: item.artworkId },
        data: {
          stockOnHand: {
            increment: Math.max(1, item.quantity),
          },
        },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
  });
}

export type ReconcilePendingStripeOrdersOptions = {
  customerId?: string;
  orderId?: string;
  limit?: number;
};

export async function reconcilePendingStripeOrders(
  options: ReconcilePendingStripeOrdersOptions = {},
) {
  const result = {
    checked: 0,
    paid: 0,
    expired: 0,
    failed: 0,
  };

  let stripe: ReturnType<typeof requireStripe>;
  try {
    stripe = requireStripe();
  } catch {
    return result;
  }

  const where: Prisma.OrderWhereInput = {
    status: "PENDING",
    stripeCheckoutId: { not: null },
  };

  if (options.customerId) {
    where.customerId = options.customerId;
  }

  if (options.orderId) {
    where.id = options.orderId;
  }

  const pendingOrders = await db.order.findMany({
    where,
    select: {
      id: true,
      stripeCheckoutId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 25,
  });

  for (const order of pendingOrders) {
    if (!order.stripeCheckoutId) {
      continue;
    }

    result.checked += 1;

    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutId);
      const siteCheckoutExpired = hasCheckoutAttemptExpired(
        getCheckoutExpiryForOrder(session, order),
      );

      if (session.payment_status === "paid") {
        if (siteCheckoutExpired) {
          await releasePendingOrder(order.id);
          result.expired += 1;
          continue;
        }

        await markOrderPaid(order.id, getPaymentIntentId(session.payment_intent), session.id);
        result.paid += 1;
        continue;
      }

      if (siteCheckoutExpired && session.status === "open") {
        await stripe.checkout.sessions.expire(order.stripeCheckoutId).catch(() => null);
      }

      if (session.status === "expired" || siteCheckoutExpired) {
        await releasePendingOrder(order.id);
        result.expired += 1;
      }
    } catch {
      result.failed += 1;
    }
  }

  return result;
}
