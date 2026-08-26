import { defineArrayMember, defineField, defineType } from "sanity";

export const collectionGroupType = defineType({
  name: "collectionGroup",
  title: "Collection Group",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 120 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "appliesTo",
      title: "Applies To",
      type: "array",
      of: [
        defineArrayMember({
          type: "string",
          options: {
            list: [
              { title: "Shop", value: "shop" },
              { title: "Portfolio", value: "portfolio" },
            ],
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
      initialValue: ["shop", "portfolio"],
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
      subtitle: "description",
    },
  },
});
