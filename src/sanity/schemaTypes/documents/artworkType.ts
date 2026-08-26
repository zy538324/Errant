import { defineArrayMember, defineField, defineType } from "sanity";
import { PricePoundsInput } from "@/sanity/components/price-pounds-input";

export const artworkType = defineType({
  name: "artwork",
  title: "Artwork",
  type: "document",
  fieldsets: [
    {
      name: "seo",
      title: "SEO & Search - help people find this photo",
      options: { collapsible: true, collapsed: false },
    },
    {
      name: "advancedPreview",
      title: "Advanced preview options - usually leave these alone",
      options: { collapsible: true, collapsed: true },
    },
    {
      name: "internal",
      title: "Internal shop settings",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Photo title",
      type: "string",
      description: "The public title shown on the website.",
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: "slug",
      title: "Page link / slug",
      type: "slug",
      description: "This creates the website address for the photo. Use Generate from the title.",
      options: { source: "title", maxLength: 180 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Photo description",
      type: "text",
      rows: 5,
      description: "A natural description for customers. This can also help search engines understand the photo.",
    }),
    defineField({
      name: "downloadFile",
      title: "1. Upload shop image here - use this for normal uploads",
      type: "r2DownloadFile",
      description:
        "Upload the full-quality image here. The site stores the customer download privately and automatically creates the website preview image.",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const document = context.document as
            | { isPublished?: boolean; title?: string }
            | undefined;
          if (document?.isPublished === false) {
            return true;
          }

          const storageKey = (value as { storageKey?: string } | undefined)
            ?.storageKey;
          return storageKey
            ? true
            : "Published shop photos need a full-quality upload here so the private customer download is stored in Cloudflare R2.";
        }),
    }),
    defineField({
      name: "pricePence",
      title: "Price (£)",
      type: "number",
      description: "Enter the customer-facing price in pounds. Example: 10 or 10.00.",
      components: {
        input: PricePoundsInput,
      },
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description: "Example: Rugby, Portrait, Landscape, Event, Fine Art.",
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
        "Optional. Use groups so the public shop can filter by event, image type, venue, or series.",
    }),
    defineField({
      name: "seoTitle",
      title: "Search title",
      type: "string",
      fieldset: "seo",
      description:
        "The title Google may show for this photo. Keep it clear and natural. If blank, the photo title is used.",
      validation: (Rule) => Rule.max(70).warning("Search titles usually work best under 70 characters."),
    }),
    defineField({
      name: "seoDescription",
      title: "Search description",
      type: "text",
      rows: 3,
      fieldset: "seo",
      description:
        "A short sentence that explains what this image is and why someone may want it. If blank, the photo description is used.",
      validation: (Rule) => Rule.max(170).warning("Search descriptions usually work best under 170 characters."),
    }),
    defineField({
      name: "seoKeywords",
      title: "Search words / phrases",
      type: "array",
      fieldset: "seo",
      of: [defineArrayMember({ type: "string" })],
      description:
        "Add words people might search for, such as rugby wall art, sports photography, local club name, match day, portrait print, fine art download. Up to 25 is plenty.",
      validation: (Rule) => Rule.max(25).warning("Too many search words can look spammy. Aim for the best 10 to 25."),
      options: { layout: "tags" },
    }),
    defineField({
      name: "location",
      title: "Location / venue",
      type: "string",
      fieldset: "seo",
      description: "Optional. Example: Cheltenham, local rugby club, stadium, studio, event venue.",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "eventName",
      title: "Event / match name",
      type: "string",
      fieldset: "seo",
      description: "Optional. Add the event, match, shoot, collection, or series name if relevant.",
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: "subjectTags",
      title: "Subject tags",
      type: "array",
      fieldset: "seo",
      of: [defineArrayMember({ type: "string" })],
      description: "Optional. Add simple subject words such as try line, scrum, portrait, landscape, black and white, action shot.",
      validation: (Rule) => Rule.max(20),
      options: { layout: "tags" },
    }),
    defineField({
      name: "previewAlt",
      title: "Image description for accessibility",
      type: "string",
      fieldset: "seo",
      description: "Describe what is in the image for screen readers and search engines.",
      validation: (Rule) => Rule.max(180),
    }),
    defineField({
      name: "collectionSlug",
      title: "Collection Slug",
      type: "string",
      fieldset: "internal",
      description: "Internal collection folder/slug. Usually leave this unchanged once set.",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "shopArtworkId",
      title: "Shop Artwork ID",
      type: "string",
      fieldset: "internal",
      description: "Internal checkout/download ID. Usually leave this unchanged.",
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "stockOnHand",
      title: "Stock On Hand",
      type: "number",
      fieldset: "internal",
      description:
        "Leave blank for unlimited digital stock. Set 0 to mark as sold out.",
      validation: (Rule) => Rule.integer().min(0),
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      fieldset: "internal",
      validation: (Rule) => Rule.required().length(3),
      initialValue: "GBP",
    }),
    defineField({
      name: "previewImage",
      title: "Auto-created website preview image",
      type: "image",
      options: { hotspot: true },
      fieldset: "advancedPreview",
      hidden: ({ document }) =>
        !Boolean((document as { downloadFile?: { storageKey?: string } })?.downloadFile?.storageKey),
      description:
        "Usually leave this alone. It is normally created automatically after using the main upload box above. Only replace it manually if you deliberately want a different public preview image.",
    }),
    defineField({
      name: "previewImageUrl",
      title: "Preview Image URL fallback",
      type: "url",
      fieldset: "advancedPreview",
      hidden: ({ document }) =>
        !Boolean((document as { downloadFile?: { storageKey?: string } })?.downloadFile?.storageKey),
      description:
        "Usually leave this blank. This is only for pointing to an existing hosted preview URL if the automatic preview is not being used.",
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
