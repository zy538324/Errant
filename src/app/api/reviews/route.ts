import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCustomer } from "@/lib/auth";
import { createPendingCustomerReview } from "@/lib/customer-reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  displayName: z.string().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(1000),
  consent: z.literal(true),
});

function getReviewSubmissionError(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : "Unable to submit your review.";

  if (
    rawMessage.includes("CustomerReview") ||
    rawMessage.includes("does not exist in the current database") ||
    rawMessage.includes("The table")
  ) {
    return {
      message:
        "Review submissions are not available yet because the review database update has not been applied. Please try again later.",
      status: 503,
    };
  }

  return {
    message: rawMessage,
    status: rawMessage.includes("authentication") ? 401 : 400,
  };
}

export async function POST(req: Request) {
  try {
    const customer = await requireCustomer();
    const payload = reviewSchema.parse(await req.json());
    const review = await createPendingCustomerReview({
      customerId: customer.id,
      displayName: payload.displayName,
      rating: payload.rating,
      body: payload.body,
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        status: review.status,
      },
      message:
        "Thank you. Your review has been submitted and is waiting for approval before it appears on the website.",
    });
  } catch (error) {
    const { message, status } = getReviewSubmissionError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
