import { artistProfileType } from "./documents/artistProfileType";
import { artworkType } from "./documents/artworkType";
import { collectionGroupType } from "./documents/collectionGroupType";
import { contactPageContentType } from "./documents/contactPageContentType";
import { customerReviewType } from "./documents/customerReviewType";
import { homePageContentType } from "./documents/homePageContentType";
import { portfolioItemType } from "./documents/portfolioItemType";
import { portfolioPageContentType } from "./documents/portfolioPageContentType";
import { shopPageContentType } from "./documents/shopPageContentType";
import { siteSettingsType } from "./documents/siteSettingsType";
import { r2DownloadFileType } from "./objects/r2DownloadFileType";

export const schemaTypes = [
  siteSettingsType,
  homePageContentType,
  shopPageContentType,
  portfolioPageContentType,
  contactPageContentType,
  artistProfileType,
  collectionGroupType,
  r2DownloadFileType,
  artworkType,
  portfolioItemType,
  customerReviewType,
];
