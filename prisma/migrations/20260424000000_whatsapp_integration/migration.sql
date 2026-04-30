-- CreateEnum
CREATE TYPE "PhoneInviteStatus" AS ENUM ('PENDING', 'SENT', 'ACCEPTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Marketplace"
  ADD COLUMN "whatsappGroupId" TEXT,
  ADD COLUMN "whatsappGroupName" TEXT,
  ADD COLUMN "whatsappAutoApproval" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Marketplace_whatsappGroupId_key" ON "Marketplace"("whatsappGroupId");

-- CreateTable
CREATE TABLE "PhoneInvite" (
    "id" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "PhoneInviteStatus" NOT NULL DEFAULT 'PENDING',
    "source" TEXT,
    "issuerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneInvite_phone_idx" ON "PhoneInvite"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneInvite_marketplaceId_phone_key" ON "PhoneInvite"("marketplaceId", "phone");

-- AddForeignKey
ALTER TABLE "PhoneInvite" ADD CONSTRAINT "PhoneInvite_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
