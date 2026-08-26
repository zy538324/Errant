import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "siteTitle",
      title: "Site Title",
      type: "string",
      validation: (Rule) => Rule.max(120),
      initialValue: "Errant-Arts",
    }),
    defineField({
      name: "siteDescription",
      title: "Site Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "heroEyebrow",
      title: "Hero Eyebrow",
      type: "string",
      validation: (Rule) => Rule.max(120),
      initialValue: "Errant-Arts - Fine art photography",
    }),
    defineField({
      name: "heroTitle",
      title: "Hero Title",
      type: "string",
      validation: (Rule) => Rule.max(220),
      initialValue: "Photographs of weather, stone, silence, and light.",
    }),
    defineField({
      name: "heroDescription",
      title: "Hero Description",
      type: "text",
      rows: 4,
      initialValue:
        "Original fine art and sports photography available as licensed digital downloads.",
    }),
    defineField({
      name: "brandStatement",
      title: "Brand Statement",
      type: "string",
      validation: (Rule) => Rule.max(240),
      initialValue: "Errant Arts, Using Art To Share My Passions With The World",
    }),
  ],
  preview: {
    select: {
      title: "siteTitle",
      subtitle: "heroTitle",
    },
  },
});
