import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createPendingOrder } from "@/modules/checkout";
import { resolveCheckoutCustomer } from "@/lib/auth";
import { requireStripe } from "@/lib/stripe";
import { getAdminSettingsSnapshot } from "@/lib/admin-settings";
import { checkoutRequestSchema } from "@/lib/validators";
import { db } from "@/lib/db";
import { isRetiredShopArtwork } from "@/lib/shop-availability";
import { releasePendingOrder } from "@/modules/fulfilment";
import { verifyCheckoutAttemptToken } from "@/lib/checkout-expiry";
import { recordMarketingOptIn } from "@/lib/marketing";

function normalizeSlug(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function resolveCheckoutBaseUrl(configuredAppUrl: string | null | undefined, requestUrl: string) {
  const configured = configuredAppUrl?.trim() ?? "";
  const requestOrigin = (() => {
    try {
      return new URL(requestUrl).origin;
    } catch {
      return null;
    }
  })();

  const normalizedConfigured = (() => {
    if (!configured) return null;
    const withProtocol = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
    try {
      const parsed = new URL(withProtocol);
      if (!/^https?:$/i.test(parsed.protocol)) return null;
      return parsed.origin;
    } catch {
      return null;
    }
  })();

  return normalizedConfigured ?? requestOrigin ?? "http://localhost:3000";
}

async function artworkHasDownloadSource(artworkId: string) {
  const assetCount = await db.artworkAsset.count({
    where: {
      artworkId,
      kind: { in: ["DOWNLOAD_MASTER", "ORIGINAL"] },
    },
  });

  return assetCount > 0;
}

export async function POST(req: Request) {
  try {
    const payload = checkoutRequestSchema.parse(await req.json());
    const checkoutAttempt = verifyCheckoutAttemptToken(payload.checkoutAttemptToken);
    const { customer, email } = await resolveCheckoutCustomer(payload.customerEmail);
    const stripe = requireStripe();
    const settings = getAdminSettingsSnapshot();
    const checkoutBaseUrl = resolveCheckoutBaseUrl(settings.app.appUrl, req.url);

    const requestedIds = payload.artworkIds.slice(0, 20);
    const requestedSlugs = payload.artworkSlugs.slice(0, 20).map((slug) => normalizeSlug(slug) ?? "");
    const requestedTitles = payload.artworkTitles.slice(0, 20).map((title) => title.trim());
    const searchableSlugs = requestedSlugs.filter((slug) => slug.length > 0);
    const searchableTitles = requestedTitles.filter((title) => title.length > 0);

    const matchingArtworks = await db.artwork.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ stockOnHand: null }, { stockOnHand: { gt: 0 } }],
        AND: [
          {
            OR: [
              { id: { in: requestedIds } },
              ...(searchableSlugs.length > 0 ? [{ slug: { in: searchableSlugs } }] : []),
              ...(searchableTitles.length > 0 ? [{ title: { in: searchableTitles } }] : []),
            ],
          },
        ],
      },
      select: { id: true, slug: true, title: true, pricePence: true, stockOnHand: true },
    });
    const artworks = matchingArtworks.filter((artwork) => !isRetiredShopArtwork(artwork));

    if (artworks.length === 0) {
      const publishedCount = await db.artwork.count({ where: { status: "PUBLISHED" } });
      return NextResponse.json(
        {
          error:
            publishedCount === 0
              ? "No published artworks are available in the database yet. Publish artworks before checkout."
              : "Cart items could not be matched to published artworks. Clear your cart and re-add from the gallery.",
        },
        { status: 400 },
      );
    }

    const artworksById = new Map(artworks.map((artwork) => [artwork.id, artwork] as const));
    const artworksBySlug = new Map(artworks.map((artwork) => [artwork.slug, artwork] as const));
    const uniqueArtworksByTitle = new Map<string, (typeof artworks)[number]>();
    const duplicateTitles = new Set<string>();

    artworks.forEach((artwork) => {
      const normalizedTitle = artwork.title.trim().toLowerCase();
      if (!normalizedTitle) return;
      if (uniqueArtworksByTitle.has(normalizedTitle)) {
        duplicateTitles.add(normalizedTitle);
        uniqueArtworksByTitle.delete(normalizedTitle);
        return;
      }
      if (!duplicateTitles.has(normalizedTitle)) uniqueArtworksByTitle.set(normalizedTitle, artwork);
    });

    const resolvedArtworkIds: string[] = [];
    const unresolvedItems: Array<{ id: string; slug: string | null }> = [];

    requestedIds.forEach((requestedId, index) => {
      const requestedSlug = requestedSlugs[index] ?? null;
      const requestedTitle = (requestedTitles[index] ?? "").toLowerCase();
      const resolved =
        artworksById.get(requestedId) ??
        (requestedSlug ? artworksBySlug.get(requestedSlug) : undefined) ??
        (requestedTitle ? uniqueArtworksByTitle.get(requestedTitle) : undefined);

      if (!resolved) {
        unresolvedItems.push({ id: requestedId, slug: requestedSlug });
        return;
      }

      if (!resolvedArtworkIds.includes(resolved.id)) resolvedArtworkIds.push(resolved.id);
    });

    if (unresolvedItems.length > 0) {
      return NextResponse.json(
        { error: "Some cart items are unavailable or sold out. Remove and re-add them from the gallery, then try checkout again." },
        { status: 400 },
      );
    }

    const resolvedArtworks = resolvedArtworkIds.map((id) => {
      const artwork = artworksById.get(id);
      if (!artwork) throw new Error("Unable to resolve purchasable artwork.");
      return artwork;
    });

    const undeliverableArtworks: string[] = [];
    for (const artwork of resolvedArtworks) {
      if (!(await artworkHasDownloadSource(artwork.id))) undeliverableArtworks.push(artwork.title);
    }

    if (undeliverableArtworks.length > 0) {
      return NextResponse.json(
        {
          error:
            undeliverableArtworks.length === 1
              ? `"${undeliverableArtworks[0]}" is not currently available for digital download.`
              : "Some cart items are not currently available for digital download.",
        },
        { status: 400 },
      );
    }

    const order = await createPendingOrder(customer.id, resolvedArtworkIds);
    if (payload.marketingOptIn) {
      await recordMarketingOptIn({ customerId: customer.id, email, source: "checkout", orderId: order.id, request: req });
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${checkoutBaseUrl}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${checkoutBaseUrl}/cart?cancelled=1`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        customer_email: email,
        line_items: resolvedArtworks.map((artwork) => ({
          quantity: 1,
          price_data: {
            currency: settings.stripe.priceCurrency.toLowerCase(),
            unit_amount: Number(artwork.pricePence ?? 0),
            product_data: { name: artwork.title, metadata: { artworkId: artwork.id } },
          },
        })),
        metadata: {
          orderId: order.id,
          customerId: customer.id,
          acceptedLicence: String(payload.acceptedLicence),
          checkoutAttemptExpiresAt: String(checkoutAttempt.expiresAt),
        },
        automatic_tax: { enabled: settings.stripe.automaticTax },
      });

      await db.order.update({ where: { id: order.id }, data: { stripeCheckoutId: session.id } });
    } catch (error) {
      await releasePendingOrder(order.id).catch(() => null);
      throw error;
    }

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    const lowered = message.toLowerCase();
    const status = lowered.includes("authentication") || lowered.includes("access denied") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
