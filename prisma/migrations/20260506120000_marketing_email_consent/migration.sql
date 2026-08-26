-- CreateTable
CREATE TABLE "EmailSubscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "customerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBSCRIBED',
    "consentSource" TEXT,
    "consentVersion" TEXT,
    "consentText" TEXT,
    "consentedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailSubscriber_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketingConsentEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriberId" TEXT,
    "customerId" TEXT,
    "email" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "consentVersion" TEXT,
    "consentText" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketingConsentEvent_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "EmailSubscriber" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MarketingConsentEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketingCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "previewText" TEXT,
    "bodyText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "fromEmail" TEXT NOT NULL,
    "replyToEmail" TEXT NOT NULL,
    "createdById" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketingCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketingCampaignRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketingCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MarketingCampaignRecipient_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "EmailSubscriber" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSubscriber_email_key" ON "EmailSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSubscriber_customerId_key" ON "EmailSubscriber"("customerId");

-- CreateIndex
CREATE INDEX "EmailSubscriber_status_consentedAt_idx" ON "EmailSubscriber"("status", "consentedAt");

-- CreateIndex
CREATE INDEX "MarketingConsentEvent_email_createdAt_idx" ON "MarketingConsentEvent"("email", "createdAt");

-- CreateIndex
CREATE INDEX "MarketingConsentEvent_subscriberId_createdAt_idx" ON "MarketingConsentEvent"("subscriberId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketingConsentEvent_customerId_createdAt_idx" ON "MarketingConsentEvent"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketingCampaign_status_createdAt_idx" ON "MarketingCampaign"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingCampaignRecipient_campaignId_subscriberId_key" ON "MarketingCampaignRecipient"("campaignId", "subscriberId");

-- CreateIndex
CREATE INDEX "MarketingCampaignRecipient_campaignId_status_idx" ON "MarketingCampaignRecipient"("campaignId", "status");

-- CreateIndex
CREATE INDEX "MarketingCampaignRecipient_subscriberId_createdAt_idx" ON "MarketingCampaignRecipient"("subscriberId", "createdAt");
