"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type ReviewStatus = "PENDING" | "APPROVED" | "DENIED";

type Review = {
  id: string;
  displayName: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  denialReason: string | null;
  submittedAt: string;
  approvedAt: string | null;
  deniedAt: string | null;
  customer: {
    user: {
      email: string;
      username: string;
    };
  };
  order: {
    id: string;
    status: string;
    totalPence: number;
    currency: string;
    createdAt: string;
  } | null;
  moderatedBy: {
    username: string;
    email: string;
  } | null;
};

type Props = {
  initialReviews: Review[];
};

const statuses: ReviewStatus[] = ["PENDING", "APPROVED", "DENIED"];

function Stars({ rating }: { rating: number }) {
  return <span className="text-brand-accent">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>;
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ReviewModeration({ initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [activeStatus, setActiveStatus] = useState<ReviewStatus>("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [denialReasons, setDenialReasons] = useState<Record<string, string>>({});

  const filteredReviews = useMemo(
    () => reviews.filter((review) => review.status === activeStatus),
    [activeStatus, reviews],
  );

  async function moderate(reviewId: string, action: "approve" | "deny") {
    setBusyId(reviewId);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: denialReasons[reviewId] ?? undefined }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to moderate review.");
      }

      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                status: result.review.status,
                approvedAt: result.review.approvedAt,
                deniedAt: result.review.deniedAt,
                denialReason: result.review.denialReason,
              }
            : review,
        ),
      );
      setMessage(action === "approve" ? "Review approved and published." : "Review denied and kept hidden.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to moderate review.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-10 space-y-6">
      <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-7 text-amber-100">
        Customer reviews are shown exactly as submitted. You can approve or deny a review, but you cannot edit the customer’s wording, rating, name or submission date.
      </div>

      <div className="flex flex-wrap gap-3">
        {statuses.map((status) => {
          const count = reviews.filter((review) => review.status === status).length;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.25em] transition ${activeStatus === status ? "border-brand-accent bg-brand-accent/10 text-brand-accent" : "border-white/10 bg-white/5 text-stone-400 hover:text-stone-100"}`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {message ? <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-200">{message}</div> : null}

      <div className="grid gap-5">
        {filteredReviews.map((review) => (
          <article key={review.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-stone-500">{review.status}</div>
                <h2 className="mt-2 font-serif text-3xl text-stone-50">{review.displayName}</h2>
                <div className="mt-2 text-sm"><Stars rating={review.rating} /></div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-6 text-stone-400">
                <div>Submitted: {formatDate(review.submittedAt)}</div>
                <div>Approved: {formatDate(review.approvedAt)}</div>
                <div>Denied: {formatDate(review.deniedAt)}</div>
              </div>
            </div>

            <p className="mt-6 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-5 text-base leading-8 text-stone-200">{review.body}</p>

            <div className="mt-5 grid gap-3 text-sm text-stone-400 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-stone-500">Verified customer</div>
                <div className="mt-2 text-stone-200">{review.customer.user.email}</div>
                <div className="mt-1">Username: {review.customer.user.username}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-stone-500">Linked order</div>
                {review.order ? (
                  <>
                    <div className="mt-2 text-stone-200">{review.order.id}</div>
                    <div className="mt-1">Status: {review.order.status}</div>
                    <div className="mt-1">Created: {formatDate(review.order.createdAt)}</div>
                  </>
                ) : (
                  <div className="mt-2 text-stone-300">No linked order recorded.</div>
                )}
              </div>
            </div>

            {review.status === "DENIED" && review.denialReason ? (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
                Denial reason: {review.denialReason}
              </div>
            ) : null}

            {review.status === "PENDING" ? (
              <div className="mt-6 flex flex-wrap items-end gap-3">
                <label className="block min-w-[260px] flex-1 text-sm text-stone-300">
                  Optional denial reason
                  <input
                    value={denialReasons[review.id] ?? ""}
                    onChange={(event) => setDenialReasons((current) => ({ ...current, [review.id]: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-brand-accent"
                    placeholder="Spam, duplicate, personal data, not relevant..."
                  />
                </label>
                <Button type="button" onClick={() => moderate(review.id, "approve")} disabled={busyId === review.id}>
                  {busyId === review.id ? "Working..." : "Approve"}
                </Button>
                <Button type="button" variant="outline" onClick={() => moderate(review.id, "deny")} disabled={busyId === review.id}>
                  {busyId === review.id ? "Working..." : "Deny"}
                </Button>
              </div>
            ) : null}
          </article>
        ))}

        {filteredReviews.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-stone-400">
            No {activeStatus.toLowerCase()} reviews found.
          </div>
        ) : null}
      </div>
    </div>
  );
}
