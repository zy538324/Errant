import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Cookie Policy – Errant Arts",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-stone-300 lg:px-10">
      <h1 className="font-serif text-5xl text-stone-50">Privacy &amp; Cookie Policy</h1>

      <section className="mt-8 space-y-8">
        <div>
          <h2 className="font-serif text-2xl text-stone-50">1. Overview</h2>
          <p className="mt-3 text-lg leading-8">
            Errant Arts respects your privacy. This policy explains how we collect, use and safeguard personal data when you use the website, create an account or purchase digital downloads.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">2. Data we collect</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-lg leading-8">
            <li><strong>Order information:</strong> name, email address, billing details, payment status and order references.</li>
            <li><strong>Account information:</strong> email address, login codes, session information and account activity needed to provide secure download access.</li>
            <li><strong>Usage data:</strong> basic technical information used to keep the site secure and improve the customer experience.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">3. How we use your data</h2>
          <p className="mt-3 text-lg leading-8">
            Personal data is used to process orders, provide download access, respond to support requests, protect the site from misuse and meet legal or accounting obligations. We do not sell personal data.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">4. Payment processing</h2>
          <p className="mt-3 text-lg leading-8">
            Payments are processed by Stripe. Card details are handled by Stripe and are not stored by Errant Arts. We receive order and payment confirmation information needed to fulfil your purchase.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">5. Cookies</h2>
          <p className="mt-3 text-lg leading-8">
            We use strictly necessary cookies to maintain shopping cart sessions, account login status and secure access to downloads. Optional analytics cookies are only used where enabled and can be controlled through your browser settings.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">6. Data retention</h2>
          <p className="mt-3 text-lg leading-8">
            Order records may be retained for up to seven years for tax and accounting compliance. Security and audit records are retained only for as long as reasonably needed. You may request deletion of personal information, unless we are legally required to keep it.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">7. Your rights</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-lg leading-8">
            <li>Request access to personal data we hold about you.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Request deletion where legally permissible.</li>
            <li>Withdraw consent for marketing communications at any time.</li>
          </ul>
          <p className="mt-3 text-lg leading-8">
            To exercise these rights, email{" "}
            <a href="mailto:privacy@errant-arts.co.uk" className="underline hover:text-stone-50">
              privacy@errant-arts.co.uk
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">8. Contact</h2>
          <p className="mt-3 text-lg leading-8">
            If you have questions about this policy, email{" "}
            <a href="mailto:privacy@errant-arts.co.uk" className="underline hover:text-stone-50">
              privacy@errant-arts.co.uk
            </a>
            .
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-stone-300">
          <p>Errant Arts — Fine Art Photography — Digital Downloads</p>
        </div>
      </section>
    </main>
  );
}
