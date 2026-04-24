import { expect, test } from "@playwright/test";
import { signIn } from "../fixtures/helpers";

test.describe("V1 cleanup — hidden features from bugs_pending.md", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
  });

  test("SHK-022: Activity tab hidden from owner settings", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/settings/identity");
    await expect(page.getByTestId("settings-tab-identity")).toBeVisible();
    await expect(page.getByTestId("settings-tab-activity")).toHaveCount(0);
  });

  test("SHK-023: Billing tab hidden from owner settings", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/settings/identity");
    await expect(page.getByTestId("settings-tab-identity")).toBeVisible();
    await expect(page.getByTestId("settings-tab-billing")).toHaveCount(0);
  });

  test("SHK-024: Payouts link hidden from owner sidebar", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/dashboard");
    const sidebar = page.getByTestId("owner-sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /payouts/i })).toHaveCount(0);
  });

  test("SHK-025: applications page drops approval-rate marketing copy", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/applications");
    await expect(page.getByRole("heading", { name: /applications/i }).first()).toBeVisible();
    await expect(page.getByText(/typically approve/i)).toHaveCount(0);
    await expect(page.getByText(/~70%/)).toHaveCount(0);
  });

  test("SHK-026: Share marketplace button hidden on owner dashboard", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/dashboard");
    await expect(page.getByRole("heading", { name: /welcome back/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /share marketplace/i })).toHaveCount(0);
  });

  test("SHK-028: Shouks brand logo from owner shell lands on member home", async ({
    page,
  }) => {
    await page.goto("/owner/ferrari-frenzy/dashboard");
    await expect(page.getByTestId("navbar-brand")).toBeVisible();
    await page.getByTestId("navbar-brand").click();
    await expect(page).toHaveURL(/\/home(\?|$)/);
    await expect(
      page.getByRole("heading", { name: /your marketplaces/i }),
    ).toBeVisible();
  });

  test("SHK-034/043: owned marketplaces appear once in switcher", async ({
    page,
  }) => {
    await page.goto("/owner/ferrari-frenzy/dashboard");
    await page.getByTestId("marketplace-switcher").click();
    // Ferrari Frenzy is owned by this user — should show exactly once, not twice.
    const items = page.getByRole("menuitem", { name: /ferrari frenzy/i });
    await expect(items).toHaveCount(1);
  });

  test("SHK-030: marketplace switcher clears selection outside marketplace context", async ({
    page,
  }) => {
    await page.goto("/explore");
    const switcher = page.getByTestId("marketplace-switcher");
    await expect(switcher).toBeVisible();
    await expect(switcher).toContainText(/choose a marketplace/i);
  });

  test("SHK-036: Messages ping is independent of notification count", async ({
    page,
  }) => {
    // Owner has notifications (from seed activity) but no unread DMs.
    await page.goto("/owner/ferrari-frenzy/dashboard");
    // The messages nav link exists and does NOT show a ping tied to notifications.
    await expect(
      page.getByRole("link", { name: /^messages/i }).first(),
    ).toBeVisible();
    await expect(page.getByTestId("nav-messages-ping")).toHaveCount(0);
  });

  test("SHK-027: Auction option hidden from new listing type picker", async ({
    page,
  }) => {
    await page.goto("/m/ferrari-frenzy/new");
    await expect(page.getByTestId("listing-type-fixed")).toBeVisible();
    await expect(page.getByTestId("listing-type-auction")).toHaveCount(0);
  });

  test("SHK-027: Auction toggle hidden from create-marketplace wizard", async ({
    page,
  }) => {
    await page.goto("/owner/create");
    // Walk to the Rules & behavior card by scrolling; it's on the final step.
    // The auctions-toggle must not render at all.
    await expect(page.getByTestId("auctions-toggle")).toHaveCount(0);
    await expect(page.getByTestId("anti-snipe-toggle")).toHaveCount(0);
  });

  test("SHK-041: moderation toggle hidden; Listings page defaults to Active tab", async ({
    page,
  }) => {
    await page.goto("/owner/create");
    await expect(page.getByTestId("moderation-toggle")).toHaveCount(0);

    await page.goto("/owner/ferrari-frenzy/listings");
    await expect(page.getByRole("heading", { name: /^listings/i }).first()).toBeVisible();
    // No Pending review or Flagged tabs
    await expect(page.getByRole("link", { name: /pending review/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^flagged/i })).toHaveCount(0);
  });

  test("SHK-042: Open/Public entry method option is offered in wizard and rules", async ({
    page,
  }) => {
    await page.goto("/owner/create");
    await expect(page.getByTestId("entry-method-public")).toBeVisible();

    await page.goto("/owner/ferrari-frenzy/settings/rules");
    await expect(page.getByTestId("rules-entry-public")).toBeVisible();
  });
});
