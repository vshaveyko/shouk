import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Test-only helper that restores state isolated tests need to assert on.
// - Default: re-activates the seed's four canonical memberships so destructive
//   tests (e.g. "owner can suspend a member") don't bleed into later tests.
// - { resetListings: true }: deletes listings created during the run that
//   weren't part of the seed (we identify the seeded ones by their titles)
//   so dashboard count assertions match the seed even if 02-create-marketplace
//   etc. ran first.
// - { refreshAuctions: true }: pushes auctionEndsAt forward on every active
//   auction so suites that rely on bid endpoints don't go stale a few days
//   after seeding.
// Gated to non-production.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEEDED_LISTING_TITLES = [
  "1995 Ferrari F355 Spider — $175,000",
  "1992 Ferrari 512 TR — $225,000",
  "1987 Ferrari Testarossa Monospecchio — Auction",
  "ISO: Clean 308 GT4 — up to $85k",
  "Arsenal 1998 Double-Winning Home Shirt — Signed",
  "Vintage Arsenal Scarf — 1980s Highbury",
];

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  let body: { resetListings?: boolean; refreshAuctions?: boolean } = {};
  try {
    body = (await req.json()) as {
      resetListings?: boolean;
      refreshAuctions?: boolean;
    };
  } catch {
    body = {};
  }

  await prisma.membership.updateMany({
    where: {
      user: { email: { in: ["owner@shouks.test", "member@shouks.test", "reviewer@shouks.test"] } },
    },
    data: { status: "ACTIVE" },
  });

  if (body.resetListings) {
    await prisma.listing.deleteMany({
      where: { title: { notIn: SEEDED_LISTING_TITLES } },
    });
  }

  if (body.refreshAuctions) {
    const inTwoDays = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2);
    await prisma.listing.updateMany({
      where: { type: "AUCTION", status: "ACTIVE" },
      data: { auctionEndsAt: inTwoDays },
    });
  }

  return NextResponse.json({ ok: true });
}
