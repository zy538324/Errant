import { CustomerReviewForm } from "@/components/site/customer-review-form";
import { getApprovedCustomerReviews } from "@/lib/customer-reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="text-brand-accent">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

export default async function ReviewsPage() {
  const reviews = await getApprovedCustomerReviews().catch(() => []);

  return (
    <main className="content-shell py-16 text-stone-300">
      <div className="max-w-3xl">
        <div className="eyebrow">Customer feedback</div>
        <h1 className="mt-3 font-serif text-5xl text-stone-50">Reviews</h1>
        <p className="mt-6 text-lg leading-8">
          Read verified customer reviews and, if you have purchased from Errant Arts, submit your own review for approval.
        </p>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <article key={review.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl text-stone-50">{review.displayName}</h2>
                  <div className="mt-2 text-sm"><Stars rating={review.rating} /></div>
                </div>
                <span className="rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand-accent">
                  Verified customer
                </span>
              </div>
              <p className="mt-5 text-base leading-8 text-stone-300">{review.body}</p>
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 lg:col-span-2">
            <h2 className="font-serif text-2xl text-stone-50">No published reviews yet</h2>
            <p className="mt-3 text-sm leading-7 text-stone-400">
              Verified customer reviews will appear here after they have been approved by the studio.
            </p>
          </div>
        )}
      </section>

      <div className="mt-12">
        <CustomerReviewForm />
      </div>
    </main>
  );
}
