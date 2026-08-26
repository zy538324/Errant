import { defineField, defineType } from "sanity";

export const customerReviewType = defineType({
  name: "customerReview",
  title: "Customer Review",
  type: "document",
  fields: [
    defineField({
      name: "moderationStatus",
      title: "Moderation Status",
      type: "string",
      initialValue: "pending",
      options: {
        layout: "radio",
        list: [
          { title: "Pending", value: "pending" },
          { title: "Approved", value: "approved" },
          { title: "Denied", value: "denied" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "displayName",
      title: "Display Name",
      type: "string",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      readOnly: true,
      validation: (Rule) => Rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: "body",
      title: "Review Text",
      type: "text",
      rows: 6,
      readOnly: true,
      validation: (Rule) => Rule.required().min(10).max(1000),
    }),
    defineField({
      name: "submittedAt",
      title: "Submitted At",
      type: "datetime",
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "verifiedCustomerEmail",
      title: "Verified Customer Email",
      type: "string",
      readOnly: true,
      description: "Internal moderation evidence only. This field is not shown publicly.",
    }),
    defineField({
      name: "linkedOrderId",
      title: "Linked Order ID",
      type: "string",
      readOnly: true,
      description: "Internal proof that the review came from a completed order.",
    }),
    defineField({
      name: "customerId",
      title: "Customer ID",
      type: "string",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "denialReason",
      title: "Denial Reason",
      type: "string",
      hidden: ({ document }) => document?.moderationStatus !== "denied",
      validation: (Rule) => Rule.max(120),
    }),
  ],
  preview: {
    select: {
      title: "displayName",
      rating: "rating",
      status: "moderationStatus",
      submittedAt: "submittedAt",
    },
    prepare(selection) {
      const stars = "★".repeat(selection.rating ?? 0);
      return {
        title: `${selection.title ?? "Customer"} — ${stars}`,
        subtitle: `${selection.status ?? "pending"} · ${selection.submittedAt ?? "No date"}`,
      };
    },
  },
});
