import Stripe from "stripe";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings";

function createStripeClient() {
  const settings = getAdminSettingsSnapshot();
  const stripeSecretKey = settings.stripe.secretKey;

  if (!stripeSecretKey) {
    return null;
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
    appInfo: {
      name: "Errant-Arts",
      version: "0.1.0",
    },
  });
}

export function requireStripe() {
  const stripe = createStripeClient();

  if (!stripe) {
    throw new Error("Stripe is not configured. Add the Stripe secret key in admin settings.");
  }

  return stripe;
}
