import { db } from "@/lib/db";
import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "@/sanity/env";
import { getSanityReadClient } from "@/sanity/lib/client";

export const REVIEW_STATUSES = ["pending", "approved", "denied"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const ELIGIBLE_ORDER_STATUSES = ["PAID", "FULFILLED"];
const ACTIVE_REVIEW_STATUSES = ["pending", "approved"];

export type PublicCustomerReview = Awaited<ReturnType<typeof getApprovedCustomerReviews>>[number];

type SanityReviewDocument = {
  _id: string;
  displayName: string;
  rating: number;
  body: string;
  submittedAt: string;
  moderationStatus: ReviewStatus;
  customerId?: string;
  linkedOrderId?: string;
};

function stripUnsafeCharacters(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSanityWriteToken() {
  return process.env.SANITY_API_WRITE_TOKEN?.trim() || null;
}

function getSanityApiHost() {
  return `https://${sanityProjectId}.api.sanity.io`;
}

function assertSanityWriteConfigured() {
  const token = getSanityWriteToken();
  if (!sanityProjectId || !sanityDataset || !token) {
    throw new Error(
      "Review submissions are not available yet because Sanity write access is not configured.",
    );
  }
  return token;
}

function createSanityReviewDocumentId(customerId: string) {
  return `customerReview.${customerId.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
}

async function fetchSanityReviewForCustomer(customerId: string) {
  const token = assertSanityWriteConfigured();
  const query = `*[_type == "customerReview" && customerId == $customerId && moderationStatus in $statuses][0]{_id, moderationStatus}`;
  const url = new URL(`/v${sanityApiVersion}/data/query/${sanityDataset}`, getSanityApiHost());
  url.searchParams.set("query", query);
  url.searchParams.set("perspective", "previewDrafts");
  url.searchParams.set("$customerId", JSON.stringify(customerId));
  url.searchParams.set("$statuses", JSON.stringify(ACTIVE_REVIEW_STATUSES));

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Unable to check existing customer reviews.${detail ? ` ${detail}` : ""}`);
  }

  const data = (await response.json()) as { result: { _id: string; moderationStatus: ReviewStatus } | null };
  return data.result;
}

async function createPendingSanityReview(document: SanityReviewDocument & { verifiedCustomerEmail: string }) {
  const token = assertSanityWriteConfigured();
  const mutationUrl = new URL(`/v${sanityApiVersion}/data/mutate/${sanityDataset}`, getSanityApiHost());

  const response = await fetch(mutationUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      mutations: [
        {
          createIfNotExists: {
            ...document,
            _id: `drafts.${document._id}`,
            _type: "customerReview",
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Unable to create the review in Studio.${detail ? ` ${detail}` : ""}`);
  }
}

export function sanitiseReviewDisplayName(value: string) {
  const cleaned = stripUnsafeCharacters(value).slice(0, 60);
  if (cleaned.length < 2) {
    throw new Error("Enter a display name between 2 and 60 characters.");
  }
  return cleaned;
}

export function sanitiseReviewBody(value: string) {
  const cleaned = stripUnsafeCharacters(value).slice(0, 1000);
  if (cleaned.length < 10) {
    throw new Error("Enter a review of at least 10 characters.");
  }

  const urlCount = (cleaned.match(/https?:\/\//gi) ?? []).length;
  if (urlCount > 1 || /javascript:|data:|onerror=|onload=/i.test(value)) {
    throw new Error("The review contains content that cannot be accepted.");
  }

  return cleaned;
}

export function normaliseRating(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error("Choose a rating between 1 and 5 stars.");
  }
  return value;
}

export async function getApprovedCustomerReviews() {
  const client = getSanityReadClient();
  if (!client) {
    return [] as Array<Pick<SanityReviewDocument, "_id" | "displayName" | "rating" | "body" | "submittedAt"> & { id: string }>;
  }

  const reviews = await client.fetch<Array<Pick<SanityReviewDocument, "_id" | "displayName" | "rating" | "body" | "submittedAt">>>(
    `*[_type == "customerReview" && moderationStatus == "approved"] | order(submittedAt desc){_id, displayName, rating, body, submittedAt}`,
    {},
    { next: { revalidate: 60 } },
  );

  return reviews.map((review) => ({
    ...review,
    id: review._id,
  }));
}

export async function assertCustomerCanReview(customerId: string) {
  const [eligibleOrder, existingReview] = await Promise.all([
    db.order.findFirst({
      where: {
        customerId,
        status: { in: ELIGIBLE_ORDER_STATUSES },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: {
        customer: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    }),
    fetchSanityReviewForCustomer(customerId),
  ]);

  if (!eligibleOrder) {
    throw new Error(
      "We could not verify a completed purchase for this account. Reviews can only be submitted by confirmed customers.",
    );
  }

  if (existingReview) {
    throw new Error("A review has already been submitted from this customer account.");
  }

  return eligibleOrder;
}

export async function createPendingCustomerReview(input: {
  customerId: string;
  displayName: string;
  rating: number;
  body: string;
}) {
  const order = await assertCustomerCanReview(input.customerId);
  const displayName = sanitiseReviewDisplayName(input.displayName);
  const body = sanitiseReviewBody(input.body);
  const rating = normaliseRating(input.rating);
  const documentId = createSanityReviewDocumentId(input.customerId);

  await createPendingSanityReview({
    _id: documentId,
    displayName,
    rating,
    body,
    moderationStatus: "pending",
    submittedAt: new Date().toISOString(),
    customerId: input.customerId,
    linkedOrderId: order.id,
    verifiedCustomerEmail: order.customer.user.email,
  });

  await db.auditLog.create({
    data: {
      action: "customer.review.submitted_to_studio",
      entityType: "SanityCustomerReview",
      entityId: documentId,
      metadataJson: JSON.stringify({ customerId: input.customerId, orderId: order.id }),
    },
  }).catch(() => null);

  return {
    id: documentId,
    status: "pending",
  };
}
