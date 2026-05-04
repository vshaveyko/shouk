-- Add explicit unlisted (hidden from explore) flag to Marketplace.
ALTER TABLE "Marketplace" ADD COLUMN "unlisted" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing INVITE-only marketplaces were effectively unlisted under
-- the old derivation, keep them hidden by default.
UPDATE "Marketplace" SET "unlisted" = true WHERE "entryMethod" = 'INVITE';
