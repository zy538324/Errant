import Link from "next/link";
import { getCurrentCustomerContext } from "@/lib/auth";
import { Panel } from "@/components/ui/panel";
import { ForgetAccountButton } from "@/components/account/forget-account-button";

export default async function AccountPrivacyPage() {
  const context = await getCurrentCustomerContext();

  if (!context) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
        <h1 className="font-serif text-5xl text-stone-50">Privacy &amp; data</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
          Sign in through checkout first to manage customer account data.
        </p>
        <div className="mt-8">
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

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
      <div className="eyebrow">Customer account</div>
      <h1 className="mt-3 font-serif text-5xl text-stone-50">Privacy &amp; data</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
        Manage how your customer account is retained. This area only affects the local Errant Arts customer account used for orders and download access.
      </p>

      <Panel className="mt-8 p-8">
        <h2 className="font-serif text-3xl text-stone-50">What is kept locally</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
          <p>
            Payment processing and card handling are managed by Stripe. The website keeps a minimal customer account record so that paid orders can be linked to download entitlements.
          </p>
          <p>
            Local records may include your customer identifier, order references, download entitlement records, download counts, consent status and active session records.
          </p>
        </div>
      </Panel>

      <div className="mt-8">
        <ForgetAccountButton />
      </div>
    </main>
  );
}
