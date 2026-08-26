"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

type FormState = "idle" | "code-sent" | "verified" | "submitted";

export function CustomerReviewForm() {
  const [state, setState] = useState<FormState>("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rating, setRating] = useState("5");
  const [body, setBody] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestCode() {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/account/login/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to send a verification code.");
      }
      setState("code-sent");
      setMessage("If this email address is eligible, a verification code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send a verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/account/login/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to verify the code.");
      }
      setState("verified");
      setMessage("Email verified. You can now submit your review for approval.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify the code.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName,
          rating: Number(rating),
          body,
          consent,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to submit your review.");
      }
      setState("submitted");
      setMessage("Thank you. Your review has been submitted and is waiting for approval before it appears on the website.");
      setDisplayName("");
      setRating("5");
      setBody("");
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit your review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8">
      <div className="eyebrow">Verified customers</div>
      <h2 className="mt-3 font-serif text-3xl text-stone-50">Leave a review</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-400">
        Reviews can only be submitted by customers with a completed Errant Arts purchase. Enter the email address used for your order and verify it with a 6-digit code.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <label className="block text-sm text-stone-300">
          Purchase email address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={state === "verified" || state === "submitted" || busy}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-brand-accent"
            placeholder="you@example.com"
          />
        </label>
        <div className="flex items-end">
          <Button type="button" onClick={requestCode} disabled={busy || !email || state === "verified" || state === "submitted"}>
            {busy && state === "idle" ? "Sending..." : "Send code"}
          </Button>
        </div>
      </div>

      {state !== "idle" && state !== "submitted" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="block text-sm text-stone-300">
            Verification code
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={state === "verified" || busy}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-brand-accent"
              placeholder="123456"
            />
          </label>
          <div className="flex items-end">
            <Button type="button" variant="ghost" onClick={verifyCode} disabled={busy || code.length !== 6 || state === "verified"}>
              {busy && state === "code-sent" ? "Checking..." : "Verify"}
            </Button>
          </div>
        </div>
      ) : null}

      {state === "verified" ? (
        <form onSubmit={submitReview} className="mt-8 grid gap-4">
          <label className="block text-sm text-stone-300">
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              minLength={2}
              maxLength={60}
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-brand-accent"
              placeholder="Sarah M."
            />
          </label>

          <label className="block text-sm text-stone-300">
            Rating
            <select
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-brand-accent"
            >
              <option value="5">★★★★★ — 5 stars</option>
              <option value="4">★★★★☆ — 4 stars</option>
              <option value="3">★★★☆☆ — 3 stars</option>
              <option value="2">★★☆☆☆ — 2 stars</option>
              <option value="1">★☆☆☆☆ — 1 star</option>
            </select>
          </label>

          <label className="block text-sm text-stone-300">
            Review
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              minLength={10}
              maxLength={1000}
              rows={7}
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-stone-100 outline-none focus:border-brand-accent"
              placeholder="Tell us what you thought of your purchase."
            />
          </label>

          <label className="flex gap-3 text-sm leading-6 text-stone-300">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
              className="mt-1 h-4 w-4"
            />
            <span>I confirm this review is based on my own purchase and experience, and I understand it may be published on the website if approved.</span>
          </label>

          <div>
            <Button type="submit" disabled={busy || !consent}>
              {busy ? "Submitting..." : "Submit review for approval"}
            </Button>
          </div>
        </form>
      ) : null}

      {message ? <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{message}</div> : null}
      {error ? <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div> : null}
    </section>
  );
}
