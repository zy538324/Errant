import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings";

export const CHECKOUT_EXPIRY_SECONDS = 10 * 60;
export const CHECKOUT_ATTEMPT_COOKIE = "errant_checkout_attempt";
export const CHECKOUT_EXPIRED_MESSAGE =
  "This checkout session has expired. Please return to the shop and start a new checkout.";

type CheckoutAttemptToken = {
  issuedAt: number;
  expiresAt: number;
  nonce: string;
};

function getCheckoutAttemptSecret() {
  const settings = getAdminSettingsSnapshot();
  const secret =
    process.env.CHECKOUT_ATTEMPT_SECRET?.trim() ||
    settings.security.blobSigningSecret.trim() ||
    settings.stripe.webhookSecret.trim() ||
    settings.stripe.secretKey.trim();

  if (!secret) {
    throw new Error("Checkout expiry signing is not configured.");
  }

  return secret;
}

function signCheckoutAttempt(input: CheckoutAttemptToken) {
  return createHmac("sha256", getCheckoutAttemptSecret())
    .update(`${input.issuedAt}:${input.expiresAt}:${input.nonce}`)
    .digest("hex");
}

export function createCheckoutAttemptToken(now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);
  const expiresAt = issuedAt + CHECKOUT_EXPIRY_SECONDS;
  const nonce = randomBytes(12).toString("hex");
  const signature = signCheckoutAttempt({ issuedAt, expiresAt, nonce });

  return {
    token: `${issuedAt}.${expiresAt}.${nonce}.${signature}`,
    issuedAt,
    expiresAt,
  };
}

export function verifyCheckoutAttemptToken(token: string | null | undefined) {
  const parts = token?.split(".") ?? [];
  if (parts.length !== 4) {
    throw new Error(CHECKOUT_EXPIRED_MESSAGE);
  }

  const [issuedAtRaw, expiresAtRaw, nonce, signature] = parts;
  const issuedAt = Number.parseInt(issuedAtRaw ?? "", 10);
  const expiresAt = Number.parseInt(expiresAtRaw ?? "", 10);

  if (
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    !nonce ||
    !/^[a-f0-9]{24}$/i.test(nonce) ||
    !signature ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    throw new Error(CHECKOUT_EXPIRED_MESSAGE);
  }

  const expected = signCheckoutAttempt({ issuedAt, expiresAt, nonce });
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error(CHECKOUT_EXPIRED_MESSAGE);
  }

  if (expiresAt <= Math.floor(Date.now() / 1000)) {
    throw new Error(CHECKOUT_EXPIRED_MESSAGE);
  }

  return { issuedAt, expiresAt };
}

export function getCheckoutAttemptExpiryFromSessionMetadata(
  metadata: Record<string, string> | null | undefined,
) {
  const expiresAt = Number.parseInt(metadata?.checkoutAttemptExpiresAt ?? "", 10);
  return Number.isFinite(expiresAt) ? expiresAt : null;
}

export function hasCheckoutAttemptExpired(expiresAt: number | null) {
  return typeof expiresAt === "number" && expiresAt <= Math.floor(Date.now() / 1000);
}
