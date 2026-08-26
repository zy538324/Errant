"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock3, Loader2, LockKeyhole, RotateCcw, ShieldCheck, Wallet } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import {
  getCartSubtotalPence,
  readCart,
  subscribeToCartChanges,
  type CartItem,
} from "@/lib/cart";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const CHECKOUT_EXPIRED_MESSAGE =
  "This checkout session has expired. Please return to the shop and start a new checkout.";

type CheckoutAttemptResponse = {
  status?: "active" | "expired";
  token?: string;
  expiresAt?: number;
  error?: string;
};

function formatPrice(pricePence: number) {
  return currencyFormatter.format(pricePence / 100);
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [acceptedLicence, setAcceptedLicence] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [attemptLoading, setAttemptLoading] = useState(true);
  const [checkoutAttemptToken, setCheckoutAttemptToken] = useState<string | null>(null);
  const [checkoutExpiresAt, setCheckoutExpiresAt] = useState<number | null>(null);
  const [checkoutAttemptExpired, setCheckoutAttemptExpired] = useState(false);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));

  async function loadCheckoutAttempt(restart = false) {
    setAttemptLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/checkout/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restart }),
      });
      const payload = (await response.json().catch(() => null)) as
        | CheckoutAttemptResponse
        | null;

      if (!response.ok || payload?.status === "expired" || !payload?.token || !payload.expiresAt) {
        setCheckoutAttemptToken(null);
        setCheckoutExpiresAt(null);
        setCheckoutAttemptExpired(true);
        setMessage(payload?.error ?? CHECKOUT_EXPIRED_MESSAGE);
        return;
      }

      setCheckoutAttemptToken(payload.token);
      setCheckoutExpiresAt(payload.expiresAt);
      setCheckoutAttemptExpired(false);
      setNowSeconds(Math.floor(Date.now() / 1000));
    } catch {
      setCheckoutAttemptToken(null);
      setCheckoutExpiresAt(null);
      setCheckoutAttemptExpired(true);
      setMessage("Unable to prepare checkout. Please refresh and try again.");
    } finally {
      setAttemptLoading(false);
    }
  }

  useEffect(() => {
    const syncItems = () => {
      setItems(readCart());
    };

    syncItems();
    return subscribeToCartChanges(syncItems);
  }, []);

  useEffect(() => {
    void loadCheckoutAttempt(false);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const subtotalPence = useMemo(() => getCartSubtotalPence(items), [items]);
  const hasItems = items.length > 0;
  const normalizedEmail = customerEmail.trim().toLowerCase();
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const remainingSeconds = checkoutExpiresAt
    ? Math.max(0, checkoutExpiresAt - nowSeconds)
    : 0;
  const checkoutHasExpired =
    checkoutAttemptExpired || Boolean(checkoutExpiresAt && remainingSeconds <= 0);
  const checkoutDisabled =
    !hasItems ||
    !acceptedLicence ||
    !hasValidEmail ||
    isSubmitting ||
    attemptLoading ||
    !checkoutAttemptToken ||
    checkoutHasExpired;

  return (
    <main className="content-shell py-16">
      <div className="eyebrow">Checkout</div>
      <h1 className="mt-3 font-serif text-5xl text-stone-50">Digital download checkout.</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
        Review your selected artwork, add your email, tick the licence agreement,
        and continue to secure payment. This purchase is for digital download files only.
      </p>
      <div
        className={[
          "mt-6 max-w-3xl rounded-2xl border px-4 py-3 text-sm",
          checkoutHasExpired
            ? "border-amber-300/30 bg-amber-900/20 text-amber-100"
            : "border-white/10 bg-black/20 text-stone-300",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Clock3 className="h-4 w-4" />
          {attemptLoading ? (
            <span>Preparing checkout timer...</span>
          ) : checkoutHasExpired ? (
            <span>{CHECKOUT_EXPIRED_MESSAGE}</span>
          ) : (
            <span>Checkout expires in {formatCountdown(remainingSeconds)}</span>
          )}
        </div>
        {checkoutHasExpired ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-stone-100 hover:bg-white/5"
            >
              Return to shop
            </Link>
            <button
              type="button"
              onClick={() => void loadCheckoutAttempt(true)}
              className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm text-stone-100 hover:bg-white/5"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Start a new checkout
            </button>
          </div>
        ) : null}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <Panel className="p-8">
          <div className="flex items-center gap-3 text-stone-100">
            <Wallet className="h-5 w-5 text-brand-accent" />
            Checkout details
          </div>
          {!hasItems ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-black/20 p-6 text-stone-300">
              Your cart is empty. Add artwork before starting checkout.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {items.map((item) => (
                <div
                  key={item.artworkId}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/work/${item.slug}`}
                      className="text-sm text-stone-100 hover:text-brand-highlight"
                    >
                      {item.title}
                    </Link>
                    <span className="text-sm text-stone-300">
                      {formatPrice(item.pricePence)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-300">
            <label htmlFor="checkout-email" className="block text-sm text-stone-200">
              Email for receipt and delivery
            </label>
            <input
              id="checkout-email"
              type="email"
              autoComplete="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-3 w-full rounded-full border border-white/10 bg-black/30 px-4 py-2.5 text-stone-100 outline-none placeholder:text-stone-500 focus:border-white/30"
            />
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-stone-300">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-stone-100"
                checked={marketingOptIn}
                aria-label="Tick this box to opt in to Errant Arts marketing emails"
                onChange={(event) => setMarketingOptIn(event.target.checked)}
              />
              <span className="leading-7">
                Tick this box if you would like Errant Arts to email you about
                news, events, new work, and offers. You can unsubscribe at any time.
              </span>
            </label>
          </div>
          <div className="mt-6 rounded-2xl border border-amber-200/30 bg-amber-950/20 p-5 text-sm text-stone-200">
            <div className="font-medium text-stone-50">Digital download licence agreement</div>
            <label className="mt-4 flex cursor-pointer items-start gap-4">
              <input
                type="checkbox"
                className="mt-1 h-6 w-6 shrink-0 accent-stone-100"
                checked={acceptedLicence}
                aria-label="I agree to the digital download licence terms"
                onChange={(event) => setAcceptedLicence(event.target.checked)}
              />
              <span className="leading-7">
                Tick this box to confirm you are buying a licensed digital download
                and agree to the{" "}
                <Link
                  href="/digital-download-licence"
                  className="text-brand-accent underline underline-offset-4 hover:text-brand-highlight"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Digital Download Licence Agreement
                </Link>{" "}
                before payment. Your download will appear in your account after
                payment is confirmed.
              </span>
            </label>
          </div>
          {message ? (
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-300">
              {message}
            </p>
          ) : null}
          <Button
            className="mt-8"
            disabled={checkoutDisabled}
            onClick={async () => {
              setMessage(null);
              if (!hasItems) {
                setMessage("Your cart is empty.");
                return;
              }

              if (!acceptedLicence) {
                setMessage("Please accept the licence terms before checkout.");
                return;
              }

              if (!hasValidEmail) {
                setMessage("Enter a valid email address to continue checkout.");
                return;
              }

              try {
                setIsSubmitting(true);
                const response = await fetch("/api/stripe/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    artworkIds: items.map((item) => item.artworkId),
                    artworkSlugs: items.map((item) => item.slug),
                    artworkTitles: items.map((item) => item.title),
                    acceptedLicence: true,
                    checkoutAttemptToken,
                    customerEmail: normalizedEmail,
                    marketingOptIn,
                  }),
                });

                const result = (await response.json().catch(() => null)) as
                  | { url?: string; error?: string }
                  | null;

                if (!response.ok || !result?.url) {
                  setMessage(result?.error ?? "Unable to start checkout.");
                  return;
                }

                window.location.assign(result.url);
              } catch {
                setMessage("Unable to start checkout.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Continue to secure payment
          </Button>
        </Panel>
        <Panel className="p-8">
          <div className="space-y-4 text-stone-300">
            <div className="flex items-center gap-3 text-stone-100">
              <ShieldCheck className="h-5 w-5 text-brand-accent" />
              After purchase
            </div>
            <p>
              After payment, your order and digital downloads are available
              immediately from your account area.
            </p>
            <p>
              This checkout is for licensed digital downloads only.
            </p>
            <div className="flex items-center gap-3 text-stone-100">
              <LockKeyhole className="h-5 w-5 text-brand-accent" />
              Need help?
            </div>
            <p>
              Questions about licensing, usage, or print options? Contact the
              studio and we will guide you.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-200">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{items.length}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotalPence)}</span>
              </div>
            </div>
            <div className="pt-2">
              <Link href="/cart" className="text-sm text-brand-accent hover:text-brand-highlight">
                Return to cart
              </Link>
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}
