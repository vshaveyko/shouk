-- CreateTable
CREATE TABLE "MarketplaceFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketplaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceFavorite_userId_marketplaceId_key" ON "MarketplaceFavorite"("userId", "marketplaceId");
CREATE INDEX "MarketplaceFavorite_marketplaceId_idx" ON "MarketplaceFavorite"("marketplaceId");

-- AddForeignKey
ALTER TABLE "MarketplaceFavorite" ADD CONSTRAINT "MarketplaceFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceFavorite" ADD CONSTRAINT "MarketplaceFavorite_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "Marketplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
