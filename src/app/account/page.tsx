import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentCustomerContext } from "@/lib/auth";
import { Panel } from "@/components/ui/panel";
import { AccountLogoutButton } from "@/components/account/account-logout-button";
import { CustomerLoginForm } from "@/components/account/customer-login-form";
import { reconcilePendingStripeOrders } from "@/modules/fulfilment";

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

function formatPrice(pence: number) {
  return gbpFormatter.format(pence / 100);
}

export default async function AccountPage() {
  const context = await getCurrentCustomerContext();

  if (!context) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
        <div className="eyebrow">Customer account</div>
        <h1 className="mt-3 font-serif text-5xl text-stone-50">Access your account.</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
          Enter the email address used during checkout and we will send a 6-digit code so you can view orders and download purchased files.
        </p>
        <div className="mt-8">
          <CustomerLoginForm />
        </div>
        <div className="mt-6">
          <Link
            href="/shop"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5"
          >
            Return to shop
          </Link>
        </div>
      </main>
    );
  }

  await reconcilePendingStripeOrders({ customerId: context.customer.id });

  const [orders, entitlementCount] = await Promise.all([
    db.order.findMany({
      where: { customerId: context.customer.id },
      include: {
        items: {
          include: {
            artwork: {
              select: { title: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.downloadEntitlement.count({
      where: { customerId: context.customer.id },
    }),
  ]);

  const totalSpentPence = orders
    .filter((order) => order.status === "PAID" || order.status === "FULFILLED")
    .reduce((sum, order) => sum + order.totalPence, 0);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Customer account</div>
          <h1 className="mt-3 font-serif text-5xl text-stone-50">Welcome back.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
            Track orders, open downloads, and review your recent purchases.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/account/downloads"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5"
          >
            View downloads
          </Link>
          <AccountLogoutButton />
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Panel className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Orders</p>
          <p className="mt-3 text-3xl font-semibold text-stone-100">{orders.length}</p>
        </Panel>
        <Panel className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Downloads</p>
          <p className="mt-3 text-3xl font-semibold text-stone-100">{entitlementCount}</p>
        </Panel>
        <Panel className="p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Total spent</p>
          <p className="mt-3 text-3xl font-semibold text-stone-100">
            {formatPrice(totalSpentPence)}
          </p>
        </Panel>
      </div>

      <Panel className="mt-8 p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-3xl text-stone-50">Recent orders</h2>
          <Link
            href="/shop"
            className="text-sm text-brand-accent hover:text-brand-highlight"
          >
            Continue shopping
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="mt-6 text-stone-300">
            No orders yet. Explore the gallery to start your collection.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-stone-100">
                      Order{" "}
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-brand-accent hover:text-brand-highlight"
                      >
                        {order.id}
                      </Link>
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                      {new Date(order.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-stone-100">{formatPrice(order.totalPence)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                      {order.status}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-stone-300">
                  {order.items.map((item) => item.artwork.title).join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </main>
  );
}
