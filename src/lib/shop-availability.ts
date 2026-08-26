const retiredShopArtworkSlugs = new Set(["rugby-player-passing"]);
const retiredShopArtworkTitles = new Set(["rugby player passing"]);

function normalizeShopText(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeSlug(value: string | null | undefined) {
  return normalizeShopText(value).replace(/\s+/g, "-");
}

export function isRetiredShopArtwork(item: {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
}) {
  const idSlug = item.id?.startsWith("sanity:") ? item.id.slice("sanity:".length) : item.id;
  const slug = normalizeSlug(item.slug ?? idSlug);
  const title = normalizeShopText(item.title);

  return retiredShopArtworkSlugs.has(slug) || retiredShopArtworkTitles.has(title);
}
