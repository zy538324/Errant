import { defineArrayMember, defineField, defineType } from "sanity";

export const contactPageContentType = defineType({
  name: "contactPageContent",
  title: "Contact Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.max(180),
      initialValue: "Contact",
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "text",
      rows: 4,
      initialValue:
        "Add direct contact details, commission enquiries, and gallery representation information here.",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "intro",
    },
  },
});
