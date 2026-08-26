import { defineArrayMember, defineField, defineType } from "sanity";

export const portfolioItemType = defineType({
  name: "portfolioItem",
  title: "Portfolio Item",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 180 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "collectionSlug",
      title: "Collection Slug",
      type: "string",
      description:
        "Use this to group related shoots or events together, for example rugby-finals-2026.",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description:
        "A simple label such as Event, Portrait, Landscape, Action, or Behind the Scenes.",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "groups",
      title: "Collection Groups",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "collectionGroup" }],
        }),
      ],
      description:
        "Use groups to power filter chips like Event Type, Discipline, Venue, or Series.",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 5,
    }),
    defineField({
      name: "previewImage",
      title: "Preview Image",
      type: "image",
      options: { hotspot: true },
      description:
        "Upload the public portfolio preview here. It is still proxied and watermarked by the storefront.",
    }),
    defineField({
      name: "previewImageUrl",
      title: "Preview Image URL",
      type: "url",
      description:
        "Optional fallback if you want to point at an existing hosted preview instead of uploading into Sanity.",
    }),
    defineField({
      name: "previewAlt",
      title: "Preview Alt Text",
      type: "string",
      validation: (Rule) => Rule.max(180),
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "isPublished",
      title: "Published",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "category",
      media: "previewImage",
    },
  },
});
