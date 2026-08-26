import { defineField, defineType } from "sanity";

export const portfolioPageContentType = defineType({
  name: "portfolioPageContent",
  title: "Portfolio Page",
  type: "document",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      validation: (Rule) => Rule.max(120),
      initialValue: "Portfolio",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.max(220),
      initialValue: "Fine Art & Sports Photography",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      initialValue:
        "Explore selected images by collection, subject, and event. When a piece is available to buy, it is sold as a licensed digital download.",
    }),
    defineField({
      name: "emptyMessage",
      title: "Empty Message",
      type: "text",
      rows: 3,
      initialValue:
        "No portfolio items match these filters yet. Adjust the filters or publish more work in Studio.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "description",
    },
  },
});
