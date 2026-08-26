import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentCustomerContext } from "@/lib/auth";
import { Panel } from "@/components/ui/panel";
import { DownloadLinkButton } from "@/components/account/download-link-button";
import { ClearCartAfterPayment } from "@/components/account/clear-cart-after-payment";
import { reconcilePendingStripeOrders } from "@/modules/fulfilment";

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

function formatPrice(pence: number) {
  return gbpFormatter.format(pence / 100);
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ payment?: string; success?: string }>;
}) {
  const [{ orderId }, query, context] = await Promise.all([
    params,
    searchParams,
    getCurrentCustomerContext(),
  ]);

  if (!context) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
        <h1 className="font-serif text-5xl text-stone-50">Order</h1>
        <p className="mt-4 text-lg leading-8 text-stone-300">
          Sign in from the same browser used at checkout to view this order.
        </p>
        <div className="mt-8">
          <Link
            href="/checkout"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5"
          >
            Return to checkout
          </Link>
        </div>
      </main>
    );
  }

  await reconcilePendingStripeOrders({
    customerId: context.customer.id,
    orderId,
  });

  const order = await db.order.findFirst({
    where: { id: orderId, customerId: context.customer.id },
    include: {
      items: {
        include: {
          artwork: {
            select: { id: true, title: true, slug: true },
          },
        },
      },
      entitlements: {
        select: {
          id: true,
          artworkId: true,
          downloadCount: true,
          maxDownloads: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const entitlementByArtwork = new Map(
    order.entitlements.map((entitlement) => [entitlement.artworkId, entitlement] as const),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Order details</div>
          <h1 className="mt-3 font-serif text-5xl text-stone-50">Order {order.id}</h1>
          <p className="mt-4 text-lg leading-8 text-stone-300">
            Created {new Date(order.createdAt).toLocaleString("en-GB")} ·{" "}
            <Link
              href="/digital-download-licence"
              className="text-brand-accent underline underline-offset-4 hover:text-brand-highlight"
            >
              Digital Download Licence Agreement
            </Link>
          </p>
        </div>
        <Link
          href="/account"
          className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5"
        >
          Back to account
        </Link>
      </div>

      {query.success === "1" ? (
        <>
          <ClearCartAfterPayment />
          <div className="mt-8 rounded-2xl border border-emerald-300/30 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-100">
            Payment confirmed. Your downloads are now available below and your cart has been cleared.
          </div>
        </>
      ) : query.payment === "pending" ? (
        <div className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">
          Checkout is still confirming payment. Refresh this order in a moment if downloads are not visible yet.
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Panel className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Status</p>
          <p className="mt-3 text-2xl font-semibold text-stone-100">{order.status}</p>
        </Panel>
        <Panel className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Items</p>
          <p className="mt-3 text-2xl font-semibold text-stone-100">{order.items.length}</p>
        </Panel>
        <Panel className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Total</p>
          <p className="mt-3 text-2xl font-semibold text-stone-100">
            {formatPrice(order.totalPence)}
          </p>
        </Panel>
      </div>

      <Panel className="mt-8 p-8">
        <h2 className="font-serif text-3xl text-stone-50">Order items</h2>
        <div className="mt-6 space-y-3">
          {order.items.map((item) => {
            const entitlement = entitlementByArtwork.get(item.artworkId);

            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
              >
                <div>
                  <p className="text-sm text-stone-100">
                    <Link
                      href={`/work/${item.artwork.slug}`}
                      className="hover:text-brand-highlight"
                    >
                      {item.artwork.title}
                    </Link>
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    {formatPrice(item.unitPence)} • Qty {item.quantity}
                    {entitlement ? " • Digital download licence" : ""}
                  </p>
                </div>

                {entitlement ? (
                  <DownloadLinkButton
                    entitlementId={entitlement.id}
                    downloadCount={entitlement.downloadCount}
                    maxDownloads={entitlement.maxDownloads}
                  />
                ) : order.status === "PENDING" ? (
                  <p className="text-xs text-stone-400">Available after payment confirmation</p>
                ) : (
                  <p className="text-xs text-stone-400">Download not available</p>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </main>
  );
}
