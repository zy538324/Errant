export const sanityApiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-03-27";
export const sanityDataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const sanityProjectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "ap75fu72";
export const sanityStudioTitle =
  process.env.NEXT_PUBLIC_SANITY_STUDIO_TITLE ?? "Errant Arts Studio";

export function isSanityConfigured() {
  return Boolean(
    sanityProjectId &&
      sanityProjectId !== "replace-with-your-sanity-project-id" &&
      sanityDataset,
  );
}
