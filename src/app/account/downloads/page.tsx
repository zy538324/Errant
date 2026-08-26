import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentCustomerContext } from "@/lib/auth";
import { Panel } from "@/components/ui/panel";
import { DownloadLinkButton } from "@/components/account/download-link-button";
import { reconcilePendingStripeOrders } from "@/modules/fulfilment";

export default async function DownloadsPage() {
  const context = await getCurrentCustomerContext();

  if (!context) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
        <h1 className="font-serif text-5xl text-stone-50">Downloads</h1>
        <p className="mt-4 text-lg leading-8 text-stone-300">
          We couldn&apos;t find an active customer session for this browser.
        </p>
        <div className="mt-8">
          <Link
            href="/checkout"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5"
          >
            Go to checkout
          </Link>
        </div>
      </main>
    );
  }

  await reconcilePendingStripeOrders({ customerId: context.customer.id });

  const entitlements = await db.downloadEntitlement.findMany({
    where: {
      customerId: context.customer.id,
      order: { status: { in: ["PAID", "FULFILLED"] } },
    },
    include: {
      artwork: {
        select: { title: true, slug: true },
      },
      order: {
        select: { id: true, createdAt: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Your files</div>
          <h1 className="mt-3 font-serif text-5xl text-stone-50">Downloads</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
            Open your purchased files and track how many download attempts remain.{" "}
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

      <Panel className="mt-8 p-8">
        {entitlements.length === 0 ? (
          <p className="text-stone-300">
            No downloads available yet. Complete a purchase and your files will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {entitlements.map((entitlement) => (
                <div
                  key={entitlement.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                >
                  <div>
                    <p className="text-sm text-stone-100">{entitlement.artwork.title}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      Order{" "}
                      <Link
                        href={`/account/orders/${entitlement.order.id}`}
                        className="text-brand-accent hover:text-brand-highlight"
                      >
                        {entitlement.order.id}
                      </Link>{" "}
                      • Digital download licence
                    </p>
                  </div>
                  <DownloadLinkButton
                    entitlementId={entitlement.id}
                    downloadCount={entitlement.downloadCount}
                    maxDownloads={entitlement.maxDownloads}
                  />
                </div>
              ))}
          </div>
        )}
      </Panel>
    </main>
  );
}
