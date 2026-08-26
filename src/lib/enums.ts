// String-constant equivalents of Prisma enums.
// The runtime values are kept identical to the old enum values so existing
// business logic continues to work unchanged.

export const UserRole = {
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ArtworkStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;
export type ArtworkStatus = (typeof ArtworkStatus)[keyof typeof ArtworkStatus];

export const AssetKind = {
  ORIGINAL: "ORIGINAL",
  PREVIEW: "PREVIEW",
  WATERMARKED_PREVIEW: "WATERMARKED_PREVIEW",
  DOWNLOAD_MASTER: "DOWNLOAD_MASTER",
} as const;
export type AssetKind = (typeof AssetKind)[keyof typeof AssetKind];

export const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FULFILLED: "FULFILLED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const BlogPostStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
} as const;
export type BlogPostStatus = (typeof BlogPostStatus)[keyof typeof BlogPostStatus];

export const PrintOrderStatus = {
  PENDING: "PENDING",
  SUBMITTED: "SUBMITTED",
  PRODUCING: "PRODUCING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
} as const;
export type PrintOrderStatus = (typeof PrintOrderStatus)[keyof typeof PrintOrderStatus];
