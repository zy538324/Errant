import { defineArrayMember, defineField, defineType } from "sanity";

export const homePageContentType = defineType({
  name: "homePageContent",
  title: "Home Page",
  type: "document",
  fields: [
    defineField({
      name: "heroNotesEyebrow",
      title: "Hero Notes Eyebrow",
      type: "string",
      validation: (Rule) => Rule.max(120),
      initialValue: "Collector notes",
    }),
    defineField({
      name: "heroNotes",
      title: "Hero Notes",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (Rule) => Rule.required().max(120),
            }),
            defineField({
              name: "body",
              title: "Body",
              type: "text",
              rows: 3,
              validation: (Rule) => Rule.required().max(240),
            }),
          ],
          preview: {
            select: {
              title: "title",
              subtitle: "body",
            },
          },
        }),
      ],
      validation: (Rule) => Rule.max(4),
      initialValue: [
        {
          title: "Fine art and sport",
          body: "Browse original photography from landscapes, places, events, and live action.",
        },
        {
          title: "Digital downloads",
          body: "Selected works are available to buy online as licensed digital files.",
        },
        {
          title: "Clear licence terms",
          body: "Review the licence at checkout before completing your purchase.",
        },
      ],
    }),
    defineField({
      name: "featuredEyebrow",
      title: "Featured Section Eyebrow",
      type: "string",
      validation: (Rule) => Rule.max(120),
      initialValue: "Featured works",
    }),
    defineField({
      name: "featuredTitle",
      title: "Featured Section Title",
      type: "string",
      validation: (Rule) => Rule.max(220),
      initialValue: "Choose your next image.",
    }),
    defineField({
      name: "featuredDescription",
      title: "Featured Section Description",
      type: "text",
      rows: 3,
      initialValue:
        "Browse fine art and sports photography, then purchase selected works as digital downloads with clear licence terms.",
    }),
    defineField({
      name: "protectionEyebrow",
      title: "Protection Eyebrow",
      type: "string",
      validation: (Rule) => Rule.max(120),
      initialValue: "Digital download purchase",
    }),
    defineField({
      name: "protectionTitle",
      title: "Protection Title",
      type: "string",
      validation: (Rule) => Rule.max(220),
      initialValue: "Simple, clear, and ready after checkout.",
    }),
    defineField({
      name: "protectionDescription",
      title: "Protection Description",
      type: "text",
      rows: 4,
      initialValue:
        "Choose the image you want, accept the digital licence terms, and complete payment securely.",
    }),
    defineField({
      name: "protectionPoints",
      title: "Protection Points",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (Rule) => Rule.max(8),
      initialValue: [
        "Selected works sold as licensed digital downloads",
        "Licence terms shown clearly before payment",
        "Secure Stripe checkout",
        "Downloads available in your account after payment",
      ],
    }),
    defineField({
      name: "workflowEyebrow",
      title: "Workflow Eyebrow",
      type: "string",
      validation: (Rule) => Rule.max(120),
      initialValue: "How it works",
    }),
    defineField({
      name: "workflowTitle",
      title: "Workflow Title",
      type: "string",
      validation: (Rule) => Rule.max(220),
      initialValue: "From gallery wall to your collection.",
    }),
    defineField({
      name: "workflowCards",
      title: "Workflow Cards",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (Rule) => Rule.required().max(120),
            }),
            defineField({
              name: "body",
              title: "Body",
              type: "text",
              rows: 3,
              validation: (Rule) => Rule.required().max(240),
            }),
          ],
          preview: {
            select: {
              title: "title",
              subtitle: "body",
            },
          },
        }),
      ],
      validation: (Rule) => Rule.max(6),
      initialValue: [
        {
          title: "Discover",
          body: "Browse collections by mood, location, and story to find the piece that speaks to you.",
        },
        {
          title: "Select",
          body: "Choose your artwork and review licence details before you head to checkout.",
        },
        {
          title: "Checkout",
          body: "Complete payment with Stripe and receive immediate order confirmation.",
        },
        {
          title: "Receive",
          body: "Your digital files appear in your account after payment. Online checkout is currently for digital downloads only.",
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "featuredTitle",
      subtitle: "protectionTitle",
    },
  },
});
