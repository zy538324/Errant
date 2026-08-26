import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireStripe } from "@/lib/stripe";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings";
import { CHECKOUT_EXPIRED_MESSAGE } from "@/lib/checkout-expiry";
import {
  markCheckoutSessionPaid,
  releaseExpiredCheckoutSession,
} from "@/modules/fulfilment";

export async function POST(req: Request) {
  try {
    const stripe = requireStripe();
    const settings = getAdminSettingsSnapshot();
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature");
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
      settings.stripe.webhookSecret.trim();

    if (!signature || !webhookSecret) {
      return new NextResponse("Webhook secret not configured.", { status: 500 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        await markCheckoutSessionPaid(session).catch((error) => {
          if (error instanceof Error && error.message === CHECKOUT_EXPIRED_MESSAGE) {
            return null;
          }

          throw error;
        });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await releaseExpiredCheckoutSession(session);
    }

    return new NextResponse("ok");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    return new NextResponse(message, { status: 400 });
  }
}
