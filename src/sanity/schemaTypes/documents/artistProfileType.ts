import { defineArrayMember, defineField, defineType } from "sanity";

export const artistProfileType = defineType({
  name: "artistProfile",
  title: "Artist Profile",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required().max(120),
      initialValue: "Mark McNeill",
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      validation: (Rule) => Rule.max(180),
      initialValue: "Using Art To Share My Passions With The World",
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "portrait",
      title: "Portrait",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "biography",
      title: "Biography",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
        }),
      ],
    }),
    defineField({
      name: "signatureName",
      title: "Signature Name",
      type: "string",
      initialValue: "Sean",
      validation: (Rule) => Rule.max(120),
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "headline",
      media: "portrait",
    },
  },
});
