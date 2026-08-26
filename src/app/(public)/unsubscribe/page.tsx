import Link from "next/link";
import { unsubscribeMarketingSubscriber } from "@/lib/marketing";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawToken = resolvedSearchParams.token;
  const token = typeof rawToken === "string" ? rawToken : rawToken?.[0] ?? "";
  const result = token ? await unsubscribeMarketingSubscriber(token) : null;

  return (
    <main className="content-shell py-16">
      <div className="eyebrow">Email preferences</div>
      <h1 className="mt-3 max-w-3xl font-serif text-5xl text-stone-50">
        Marketing email unsubscribe.
      </h1>
      <div className="mt-8 max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-stone-300">
        {result?.ok ? (
          <div className="space-y-4">
            <p className="text-lg leading-8 text-stone-100">
              {result.email} has been removed from Errant Arts marketing emails.
            </p>
            <p className="leading-7">
              Transactional emails about orders, account access, or digital
              downloads may still be sent where needed to provide the service.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg leading-8 text-stone-100">
              This unsubscribe link could not be verified.
            </p>
            <p className="leading-7">
              Please reply to the email with “unsubscribe” or contact Errant
              Arts and the address will be removed manually.
            </p>
          </div>
        )}
        <div className="mt-8">
          <Link
            href="/contact"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-stone-100 hover:bg-white/5"
          >
            Contact Errant Arts
          </Link>
        </div>
      </div>
    </main>
  );
}
