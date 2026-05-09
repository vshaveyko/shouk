import { expect, test } from "@playwright/test";
import { signIn, signOut } from "../fixtures/helpers";

// Tracker: revisits of items that were previously closed as Won't Fix
// because the schema/infra they depended on hadn't shipped. Both items
// covered here are now self-contained — see resolution notes in the
// tracker for the original closure rationale.

test.describe("Won't Fix revisits", () => {
  test.beforeAll(async ({ request }) => {
    // Re-activate seed memberships in case earlier suites suspended them
    // and refresh seeded auctions so the bid endpoint accepts new bids.
    await request.post("/api/e2e-reset", {
      data: { refreshAuctions: true },
    });
  });

  // SHK-009 — listing-specific buyer/seller chat.
  // The MessageThread.listingId column + Message Seller button + threading
  // API have all shipped (08-messaging.spec.ts already exercises the full
  // flow). This is a thin marker test so the tracker ID is searchable in
  // the suite per the bugfixer rule.
  test("SHK-009: listing page exposes a Message Seller entry point that carries the listing id", async ({
    page,
  }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");

    const listingsRes = await page.request.get(
      "/api/marketplaces/ferrari-frenzy/listings",
    );
    expect(listingsRes.ok()).toBeTruthy();
    const listings = (await listingsRes.json()) as Array<{
      id: string;
      sellerId: string;
      type: string;
      seller: { displayName: string | null };
    }>;
    // Pick a FIXED listing not sold by the signed-in member (Sasha Member);
    // the Message Seller button is hidden when viewing your own listing.
    const fixed = listings.find(
      (l) =>
        l.type === "FIXED" &&
        l.seller?.displayName !== "Sasha Member",
    );
    expect(fixed).toBeTruthy();

    await page.goto(`/l/${fixed!.id}`);
    const msgBtn = page.getByTestId("message-seller").first();
    await expect(msgBtn).toBeVisible();
    await msgBtn.click();
    await expect(page).toHaveURL(
      new RegExp(
        `/m/ferrari-frenzy/messages\\?seller=${fixed!.sellerId}&listing=${fixed!.id}`,
      ),
    );
  });

  // WA-009 — suspending or banning a member cancels their open bids in
  // that marketplace. Previously closed because policy was undefined; the
  // policy is now: bids are deleted on SUSPEND/BAN (the user can't engage
  // while they're not ACTIVE; leaving phantom high-bids on the leaderboard
  // would corrupt the auction outcome). BAN additionally REMOVEs their own
  // listings (already in place from WA-007).
  test("WA-009: suspending a member cancels their active bids in the marketplace", async ({
    page,
  }) => {
    // 1. Member places a bid on the Ferrari Frenzy auction.
    await signIn(page, "member@shouks.test", "Test123!@#");
    const listingsRes = await page.request.get(
      "/api/marketplaces/ferrari-frenzy/listings?type=AUCTION",
    );
    expect(listingsRes.ok()).toBeTruthy();
    const listings = (await listingsRes.json()) as Array<{
      id: string;
      type: string;
      status: string;
    }>;
    const auction = listings.find(
      (l) => l.type === "AUCTION" && l.status === "ACTIVE",
    );
    expect(auction).toBeTruthy();

    const detailRes = await page.request.get(`/api/listings/${auction!.id}`);
    const detail = (await detailRes.json()) as {
      bids: Array<{ userId: string; amountCents: number }>;
      auctionStartCents: number | null;
      auctionMinIncrementCents: number | null;
    };
    const currentHigh =
      detail.bids[0]?.amountCents ?? detail.auctionStartCents ?? 0;
    const increment = detail.auctionMinIncrementCents ?? 100;
    const bidAmount = currentHigh + increment + 100;

    const bidRes = await page.request.post(
      `/api/listings/${auction!.id}/bid`,
      {
        data: { amountCents: bidAmount },
      },
    );
    expect(bidRes.ok()).toBeTruthy();

    const afterBidRes = await page.request.get(`/api/listings/${auction!.id}`);
    const afterBid = (await afterBidRes.json()) as {
      bids: Array<{ userId: string; amountCents: number }>;
    };
    const memberBidsBefore = afterBid.bids.filter(
      (b) => b.amountCents === bidAmount,
    );
    expect(memberBidsBefore.length).toBe(1);
    const memberUserId = memberBidsBefore[0].userId;

    // 2. Owner suspends the member. /home is the post-signin landing for
    // owners with multiple owned marketplaces (no auto-redirect).
    await signOut(page);
    await signIn(page, "owner@shouks.test", "Test123!@#");
    const suspendRes = await page.request.post(
      "/api/marketplaces/ferrari-frenzy/members",
      {
        data: {
          userId: memberUserId,
          action: "SUSPEND",
          reason: "WA-009 e2e",
        },
      },
    );
    expect(suspendRes.ok()).toBeTruthy();

    // 3. The bid the member placed before suspension should be gone.
    const afterSuspendRes = await page.request.get(
      `/api/listings/${auction!.id}`,
    );
    const afterSuspend = (await afterSuspendRes.json()) as {
      bids: Array<{ userId: string }>;
    };
    expect(afterSuspend.bids.find((b) => b.userId === memberUserId)).toBeUndefined();

    // 4. Reinstate so later tests can rely on member being ACTIVE.
    const reinstateRes = await page.request.post(
      "/api/marketplaces/ferrari-frenzy/members",
      {
        data: { userId: memberUserId, action: "REINSTATE" },
      },
    );
    expect(reinstateRes.ok()).toBeTruthy();
  });
});
