export function friendlyErrorMessage(input: unknown, fallback = "Something went wrong. Please try again.") {
  if (!input) return fallback;

  const raw = typeof input === "string" ? input : input instanceof Error ? input.message : String(input);

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((issue) => {
          const path = Array.isArray(issue.path) ? issue.path.join(".") : "field";
          const message = typeof issue.message === "string" ? issue.message : "Please check this value.";
          if (path === "previewImageUrl") return "The preview URL can be left blank, or it must start with https://";
          if (path.includes("pricePence")) return "Please enter a valid price.";
          if (path.includes("uploads")) return "Please upload at least one image before saving.";
          if (path.includes("slug")) return "The slug can only use lowercase letters, numbers and hyphens.";
          return message;
        })
        .join(" ");
    }
  } catch {
    // Not JSON.
  }

  if (raw.includes("Invalid url") || raw.includes("Hosted preview URLs")) {
    return "The preview URL can be left blank, or it must start with https://";
  }
  if (raw.includes("Only supported image uploads")) {
    return "This file type is not supported. Please upload JPG, PNG, WebP, TIFF, AVIF, HEIC or HEIF.";
  }
  if (raw.includes("100") && raw.toLowerCase().includes("bytes")) {
    return "This file is too large. Please upload an image below 100MB.";
  }
  if (raw.includes("Unique constraint") || raw.includes("Unique constraint failed")) {
    return "An item with this slug or email already exists. Please choose a different value.";
  }
  if (raw.includes("Cloudflare R2 request failed")) {
    return "The image storage service rejected the request. Please check the R2 settings and try again.";
  }

  return raw || fallback;
}
