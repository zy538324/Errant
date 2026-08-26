"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import {
  clearCart,
  getCartItemCount,
  getCartSubtotalPence,
  readCart,
  removeCartItem,
  subscribeToCartChanges,
  type CartItem,
} from "@/lib/cart";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

function formatPrice(pricePence: number) {
  return currencyFormatter.format(pricePence / 100);
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [checkoutMessage, setCheckoutMessage] = useState<"cancelled" | "expired" | null>(null);

  useEffect(() => {
    const syncItems = () => {
      setItems(readCart());
    };

    syncItems();
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "expired") {
      setCheckoutMessage("expired");
    } else if (params.get("cancelled") === "1") {
      setCheckoutMessage("cancelled");
    }

    return subscribeToCartChanges(syncItems);
  }, []);

  const itemCount = useMemo(() => getCartItemCount(items), [items]);
  const subtotalPence = useMemo(() => getCartSubtotalPence(items), [items]);
  const hasItems = items.length > 0;

  return (
    <main className="content-shell py-16">
      <div className="eyebrow">Cart</div>
      <h1 className="mt-3 font-serif text-5xl text-stone-50">Your selection.</h1>
      {checkoutMessage === "expired" ? (
        <p className="mt-4 max-w-3xl rounded-2xl border border-amber-300/30 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">
          That checkout session expired, so any reserved stock has been released. Add the artwork again to restart checkout.
        </p>
      ) : checkoutMessage === "cancelled" ? (
        <p className="mt-4 max-w-3xl rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-300">
          Checkout was cancelled. Your cart is still here so you can review it before trying again.
        </p>
      ) : null}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-8">
          {!hasItems ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-8 text-stone-300">
              Your basket is currently empty. Add artwork from the gallery to continue to checkout.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.artworkId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div>
                    <Link
                      href={`/work/${item.slug}`}
                      className="text-base text-stone-100 hover:text-brand-highlight"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-1 text-sm text-stone-400">
                      {formatPrice(item.pricePence)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCartItem(item.artworkId)}
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel className="p-8">
          <div className="flex items-center gap-3 text-stone-100">
            <ShoppingBag className="h-5 w-5 text-brand-accent" />
            <span className="font-medium">Order summary</span>
          </div>
          <div className="mt-6 space-y-3 text-sm text-stone-300">
            <div className="flex justify-between">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotalPence)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>Digital download only</span>
            </div>
            <div className="flex justify-between">
              <span>Licence</span>
              <span>Included</span>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-300">
            <div className="flex items-center gap-2 text-stone-100">
              <ShieldCheck className="h-4 w-4" />
              <span>
                Please confirm the{" "}
                <Link
                  href="/digital-download-licence"
                  className="text-brand-accent underline underline-offset-4 hover:text-brand-highlight"
                >
                  Digital Download Licence Agreement
                </Link>{" "}
                before checkout. Online purchases are currently licensed digital downloads only.
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {hasItems ? (
              <Link href="/checkout">
                <Button>Proceed to checkout</Button>
              </Link>
            ) : (
              <Button disabled>Proceed to checkout</Button>
            )}
            {hasItems ? (
              <Button variant="ghost" onClick={() => clearCart()}>
                Clear cart
              </Button>
            ) : null}
            <Link href="/shop">
              <Button variant="ghost">Browse gallery</Button>
            </Link>
          </div>
        </Panel>
      </div>
    </main>
  );
}
