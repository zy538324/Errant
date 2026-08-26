import { defineField, defineType } from "sanity";
import { R2DownloadFileInput } from "@/sanity/components/r2-download-file-input";

export const r2DownloadFileType = defineType({
  name: "r2DownloadFile",
  title: "Shop image upload",
  type: "object",
  components: {
    input: R2DownloadFileInput,
  },
  fields: [
    defineField({
      name: "uploadControl",
      title: "Upload shop image",
      type: "string",
      readOnly: true,
      description:
        "Use the upload button above. This marker keeps the simple upload box visible while the technical storage fields stay hidden.",
    }),
    defineField({
      name: "storageKey",
      title: "Cloudflare R2 Storage Key",
      type: "string",
      readOnly: true,
      hidden: true,
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: "filename",
      title: "Original Filename",
      type: "string",
      readOnly: true,
      hidden: true,
      validation: (Rule) => Rule.max(240),
    }),
    defineField({
      name: "mimeType",
      title: "MIME Type",
      type: "string",
      readOnly: true,
      hidden: true,
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: "bytes",
      title: "File Size Bytes",
      type: "number",
      readOnly: true,
      hidden: true,
      validation: (Rule) => Rule.integer().min(0),
    }),
    defineField({
      name: "uploadedAt",
      title: "Uploaded At",
      type: "datetime",
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: "filename",
    },
    prepare({ title }) {
      return {
        title: title || "Shop image upload",
      };
    },
  },
});
