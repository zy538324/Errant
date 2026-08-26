import { defineField, defineType } from "sanity";

export const shopPageContentType = defineType({
  name: "shopPageContent",
  title: "Shop Page",
  type: "document",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      validation: (Rule) => Rule.max(120),
      initialValue: "Shop",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.max(220),
      initialValue: "Browse the gallery.",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      initialValue:
        "Browse fine art and sports photography available as licensed digital downloads after checkout.",
    }),
    defineField({
      name: "gridEyebrow",
      title: "Grid Eyebrow",
      type: "string",
      validation: (Rule) => Rule.max(120),
      initialValue: "Shop catalogue",
    }),
    defineField({
      name: "gridTitle",
      title: "Grid Title",
      type: "string",
      validation: (Rule) => Rule.max(220),
      initialValue: "Filter by collection, category, and event grouping.",
    }),
    defineField({
      name: "gridDescription",
      title: "Grid Description",
      type: "text",
      rows: 4,
      initialValue:
        "Use the filters to find the subject, event, or collection that fits what you are looking for.",
    }),
    defineField({
      name: "emptyMessage",
      title: "Empty Message",
      type: "text",
      rows: 3,
      initialValue:
        "No published shop artworks match these filters yet. Try a broader filter or publish more shop artwork in Studio.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "description",
    },
  },
});
