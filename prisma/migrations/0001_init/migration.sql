-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "VerifyProvider" AS ENUM ('GOOGLE', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER', 'PHONE');

-- CreateEnum
CREATE TYPE "MarketplaceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'SCHEDULED_DELETION');

-- CreateEnum
CREATE TYPE "EntryMethod" AS ENUM ('APPLICATION', 'INVITE', 'REFERRAL');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'NUMBER', 'CURRENCY', 'SELECT', 'MULTI_SELECT', 'DATE', 'IMAGE');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFO');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('FIXED', 'AUCTION', 'ISO');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SOLD', 'CLOSED', 'RESERVE_NOT_MET', 'WON', 'REMOVED', 'SHADOW_HIDDEN');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'MISLEADING', 'PROHIBITED', 'DUPLICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationFreq" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'APPLICATION_NEEDS_INFO', 'LISTING_APPROVED', 'LISTING_REJECTED', 'LISTING_FLAGGED', 'BID_OUTBID', 'AUCTION_WON', 'AUCTION_ENDED', 'ISO_MATCH', 'NEW_LISTING_MATCH', 'MENTION', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "displayName" TEXT,
    "image" TEXT,
    "bio" TEXT,
    "defaultRole" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "phoneNumber" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerifiedAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "VerifyProvider" NOT NULL,
    "handle" TEXT NOT NULL,
    "profileUrl" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifiedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marketplace" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#4a7aff',
    "category" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "entryMethod" "EntryMethod" NOT NULL DEFAULT 'APPLICATION',
    "requiredVerifications" "VerifyProvider"[],
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "auctionsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "antiSnipe" BOOLEAN NOT NULL DEFAULT true,
    "moderationRequired" BOOLEAN NOT NULL DEFAULT false,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "monthlyPriceCents" INTEGER,
    "annualPriceCents" INTEGER,
    "status" "MarketplaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marketplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemaField" (
    "id" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "minImages" INTEGER,
    "maxImages" INTEGER,
    "maxFileSizeMb" INTEGER DEFAULT 5,
    "cardPreview" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemaField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationQuestion" (
    "id" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,

    CONSTRAINT "ApplicationQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "permissions" JSONB,
    "referrerId" TEXT,
    "suspendedUntil" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "banReason" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerNote" TEXT,
    "rejectionReason" TEXT,
    "referrerId" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ListingType" NOT NULL DEFAULT 'FIXED',
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "schemaValues" JSONB NOT NULL,
    "images" TEXT[],
    "priceCents" INTEGER,
    "currency" TEXT DEFAULT 'USD',
    "description" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "editedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "auctionStartCents" INTEGER,
    "auctionReserveCents" INTEGER,
    "auctionMinIncrementCents" INTEGER,
    "auctionStartsAt" TIMESTAMP(3),
    "auctionEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingSave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingSave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "detail" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "moderatorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" JSONB NOT NULL,
    "frequency" "NotificationFreq" NOT NULL DEFAULT 'INSTANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketplaceId" TEXT,
    "kind" "NotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "preview" TEXT,
    "deeplink" TEXT,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedAccount_provider_handle_key" ON "VerifiedAccount"("provider", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedAccount_userId_provider_key" ON "VerifiedAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Marketplace_slug_key" ON "Marketplace"("slug");

-- CreateIndex
CREATE INDEX "Marketplace_ownerId_idx" ON "Marketplace"("ownerId");

-- CreateIndex
CREATE INDEX "Marketplace_status_idx" ON "Marketplace"("status");

-- CreateIndex
CREATE INDEX "SchemaField_marketplaceId_idx" ON "SchemaField"("marketplaceId");

-- CreateIndex
CREATE INDEX "ApplicationQuestion_marketplaceId_idx" ON "ApplicationQuestion"("marketplaceId");

-- CreateIndex
CREATE INDEX "Membership_marketplaceId_idx" ON "Membership"("marketplaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_marketplaceId_key" ON "Membership"("userId", "marketplaceId");

-- CreateIndex
CREATE INDEX "Application_marketplaceId_status_idx" ON "Application"("marketplaceId", "status");

-- CreateIndex
CREATE INDEX "Application_userId_idx" ON "Application"("userId");

-- CreateIndex
CREATE INDEX "Listing_marketplaceId_status_idx" ON "Listing"("marketplaceId", "status");

-- CreateIndex
CREATE INDEX "Listing_sellerId_idx" ON "Listing"("sellerId");

-- CreateIndex
CREATE INDEX "Listing_type_idx" ON "Listing"("type");

-- CreateIndex
CREATE INDEX "Bid_listingId_idx" ON "Bid"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingSave_userId_listingId_key" ON "ListingSave"("userId", "listingId");

-- CreateIndex
CREATE INDEX "Report_listingId_idx" ON "Report"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_code_key" ON "Invite"("code");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedAccount" ADD CONSTRAINT "VerifiedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marketplace" ADD CONSTRAINT "Marketplace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemaField" ADD CONSTRAINT "SchemaField_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationQuestion" ADD CONSTRAINT "ApplicationQuestion_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingSave" ADD CONSTRAINT "ListingSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingSave" ADD CONSTRAINT "ListingSave_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingSave" ADD CONSTRAINT "ListingSave_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

