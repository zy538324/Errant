import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions – Errant Arts",
};

export default function TermsConditionsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-stone-300 lg:px-10">
      <h1 className="font-serif text-5xl text-stone-50">Terms &amp; Conditions</h1>

      <section className="mt-8 space-y-8">
        <div>
          <h2 className="font-serif text-2xl text-stone-50">1. Introduction</h2>
          <p className="mt-3 text-lg leading-8">
            These Terms &amp; Conditions govern use of the Errant-Arts.co.uk website and all online purchases made through it. By using the site or placing an order, you confirm that you have read, understood and agree to these terms.
          </p>
          <p className="mt-3 text-lg leading-8">
            “We”, “our” and “us” refer to Sean Cutland, trading as Errant Arts. “You” refers to the customer or visitor using the site.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">2. Digital download purchases</h2>
          <p className="mt-3 text-lg leading-8">
            Online checkout currently sells licensed digital downloads only. Once payment is confirmed, download access is provided through your account or order access link. Download links are unique to your order and may be subject to expiry dates or download limits for security reasons.
          </p>
          <p className="mt-3 text-lg leading-8">
            Each digital download is supplied under the separate{" "}
            <Link href="/digital-download-licence" className="underline hover:text-stone-50">
              Digital Download Licence Agreement
            </Link>
            , which explains what you can and cannot do with the purchased file.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">3. Accounts and security</h2>
          <p className="mt-3 text-lg leading-8">
            You may create or use an account to access purchases, downloads and order history. You are responsible for keeping your account access secure. Errant Arts will never ask for your password by email or any insecure channel.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">4. Refunds and support</h2>
          <p className="mt-3 text-lg leading-8">
            Digital download sales are normally final once the file has been made available. If there is a verified issue with a file, we will investigate and provide a replacement where appropriate. Full details are set out in the{" "}
            <Link href="/refunds-returns" className="underline hover:text-stone-50">
              Refunds &amp; Returns Policy
            </Link>
            .
          </p>
        </div>

        <div id="creator-rights">
          <h2 className="font-serif text-2xl text-stone-50">5. Copyright and creator rights</h2>
          <p className="mt-3 text-lg leading-8">
            All images, artworks, text and digital materials remain the intellectual property of Sean Cutland / Errant Arts unless otherwise stated in writing. Buying a digital download gives you a personal-use licence only. It does not transfer copyright, ownership or commercial rights.
          </p>
          <p className="mt-3 text-lg leading-8">
            Errant Arts reserves the right to be identified as the creator of its images and to object to unauthorised alteration, misuse or treatment that damages the integrity of the work.
          </p>
        </div>

        <div id="photoshoots">
          <h2 className="font-serif text-2xl text-stone-50">6. Private photoshoots and model release</h2>
          <p className="mt-3 text-lg leading-8">
            For private photoshoot events or sessions, Errant Arts may use selected images for portfolio, website, social media and marketing purposes unless otherwise agreed in writing before the shoot.
          </p>
          <p className="mt-3 text-lg leading-8">
            If you or any guest or participant wishes to opt out, the request must be made in writing before the date of the shoot. In some circumstances, a separate model release form may be required.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">7. Privacy</h2>
          <p className="mt-3 text-lg leading-8">
            Personal data is handled according to the{" "}
            <Link href="/privacy" className="underline hover:text-stone-50">
              Privacy &amp; Cookie Policy
            </Link>
            . This covers what data is collected, how it is used and the rights available to you.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-50">8. Changes to these terms</h2>
          <p className="mt-3 text-lg leading-8">
            These terms may be updated periodically to reflect changes in the site, services or applicable law. The latest version will be available on this page.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-stone-300">
          <p>Last updated: 2026</p>
          <p>Errant Arts — Fine Art Photography — Digital Downloads</p>
        </div>
      </section>
    </main>
  );
}
