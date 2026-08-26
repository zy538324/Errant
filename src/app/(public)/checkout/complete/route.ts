import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createCustomerSession } from "@/lib/session";
import { requireStripe } from "@/lib/stripe";
import { CHECKOUT_EXPIRED_MESSAGE } from "@/lib/checkout-expiry";
import {
  markCheckoutSessionPaid,
  releaseExpiredCheckoutSession,
} from "@/modules/fulfilment";

function redirectTo(requestUrl: string, path: string) {
  return NextResponse.redirect(new URL(path, requestUrl));
}

async function restoreCustomerSession(customerId: string | null | undefined) {
  if (!customerId) {
    return;
  }

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: { userId: true },
  });

  if (customer) {
    await createCustomerSession(customer.userId);
  }
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const sessionId = requestUrl.searchParams.get("session_id")?.trim();

  if (!sessionId) {
    return redirectTo(req.url, "/checkout?payment=missing-session");
  }

  try {
    const stripe = requireStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId?.trim() ?? null;
    const customerId = session.metadata?.customerId?.trim() ?? null;

    if (session.payment_status === "paid") {
      const order = await markCheckoutSessionPaid(session);
      await restoreCustomerSession(order.customerId ?? customerId);
      return redirectTo(req.url, `/account/orders/${order.id}?success=1`);
    }

    if (session.status === "expired") {
      await releaseExpiredCheckoutSession(session);
      await restoreCustomerSession(customerId);
      return redirectTo(req.url, "/cart?checkout=expired");
    }

    await restoreCustomerSession(customerId);
    return redirectTo(
      req.url,
      orderId
        ? `/account/orders/${orderId}?payment=pending`
        : "/account?payment=pending",
    );
  } catch (error) {
    if (error instanceof Error && error.message === CHECKOUT_EXPIRED_MESSAGE) {
      return redirectTo(req.url, "/cart?checkout=expired");
    }

    return redirectTo(req.url, "/checkout?payment=error");
  }
}
