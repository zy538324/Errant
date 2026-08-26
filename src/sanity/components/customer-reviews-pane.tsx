"use client";

export function CustomerReviewsPane() {
  return (
    <div style={{ padding: "2rem", maxWidth: "48rem" }}>
      <p style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#9ca3af" }}>
        Verified customer moderation
      </p>
      <h1 style={{ margin: "0.75rem 0 1rem", fontSize: "2rem", lineHeight: 1.2 }}>
        Customer Reviews
      </h1>
      <p style={{ margin: "0 0 1.5rem", lineHeight: 1.7, color: "#d1d5db" }}>
        Reviews are stored in the site database so they can be linked to verified customers and completed orders. Open the moderation screen to approve or deny pending reviews. Review text is read-only and cannot be edited.
      </p>
      <a
        href="/admin/reviews"
        style={{
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "999px",
          padding: "0.8rem 1.1rem",
          background: "#f5f5f4",
          color: "#111827",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Open review moderation
      </a>
      <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#9ca3af" }}>
        Direct URL: /admin/reviews
      </p>
    </div>
  );
}
