import Link from "next/link";
import { getCurrentCustomerContext } from "@/lib/auth";
import { CustomerLoginForm } from "@/components/account/customer-login-form";

export default async function AccountLoginPage() {
  const context = await getCurrentCustomerContext();

  if (context) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
        <div className="eyebrow">Customer account</div>
        <h1 className="mt-3 font-serif text-5xl text-stone-50">You are signed in.</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
          Your customer session is active. You can open your previous purchases and download entitlements from your account area.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/account/downloads"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5"
          >
            View downloads
          </Link>
          <Link
            href="/account"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5"
          >
            Account dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
      <div className="eyebrow">Customer login</div>
      <h1 className="mt-3 font-serif text-5xl text-stone-50">Access your downloads.</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
        Use the email address from checkout and we will send a short 6-digit code. No password is required.
      </p>
      <div className="mt-8">
        <CustomerLoginForm />
      </div>
    </main>
  );
}
