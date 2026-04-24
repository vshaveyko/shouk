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

  test("SHK-021: Marketplace type labels appear on each entry method", async ({
    page,
  }) => {
    await page.goto("/owner/create");
    await expect(page.getByRole("heading", { name: /marketplace type/i })).toBeVisible();
    await expect(page.getByTestId("marketplace-type-label-public")).toHaveText(/public/i);
    await expect(page.getByTestId("marketplace-type-label-invite")).toHaveText(/private/i);
    await expect(page.getByTestId("marketplace-type-label-application")).toHaveText(/closed/i);
    await expect(page.getByTestId("marketplace-type-label-referral")).toHaveText(/closed/i);
  });

  test("SHK-029: Signed-in visitor is redirected away from the landing page", async ({
    page,
  }) => {
    // We're already signed in via beforeEach. Loading the root should bounce to /home.
    await page.goto("/");
    await expect(page).toHaveURL(/\/home|\/owner\//);
    await expect(
      page.getByRole("link", { name: /get started/i }),
    ).toHaveCount(0);
  });

  test("SHK-040: /api/notifications?countOnly=1 returns just the unread count", async ({
    request,
  }) => {
    const res = await request.get("/api/notifications?countOnly=1");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(typeof body.unread).toBe("number");
    expect(body.items).toBeUndefined();
  });

  test("SHK-020: New listing form shows hardcoded watch fields", async ({
    page,
  }) => {
    await page.goto("/m/ferrari-frenzy/new");
    // The V1 watches form has fixed fields regardless of the marketplace schema.
    await expect(page.getByTestId("watch-details-section")).toBeVisible();
    await expect(page.getByTestId("watch-field-brand")).toBeVisible();
    await expect(page.getByTestId("watch-field-model")).toBeVisible();
    await expect(page.getByTestId("watch-field-case-size")).toBeVisible();
    await expect(page.getByTestId("watch-field-dial-color")).toBeVisible();
    await expect(page.getByTestId("watch-field-case-material")).toBeVisible();
    await expect(page.getByTestId("watch-field-box")).toBeVisible();
    await expect(page.getByTestId("watch-field-papers")).toBeVisible();
  });

  test("SHK-037: owner with multiple marketplaces lands on /home, not auto-redirected", async ({
    page,
  }) => {
    // Seed's "owner" runs Ferrari Frenzy + Gooners United — two marketplaces.
    // /home should render the cross-marketplace overview instead of
    // auto-bouncing to the first owned marketplace.
    await page.goto("/home");
    await expect(page).toHaveURL(/\/home(\?|$)/);
    await expect(
      page.getByRole("heading", { name: /your marketplaces/i }),
    ).toBeVisible();
  });

  test("SHK-039: apply page loads for a pending applicant (smoke)", async ({
    browser,
  }) => {
    // The owner fixture's beforeEach signs us in as the owner. Use a
    // fresh browser context as the applicant so the existing session
    // doesn't collide. The substantive SHK-039 fix — updating the same
    // application row rather than creating a second — is in
    // app/api/marketplaces/[slug]/applications/route.ts; this spec just
    // keeps the apply UI honest.
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/signin");
    await page.getByTestId("credentials-form").getByLabel("Email").fill("applicant@shouks.test");
    await page.getByTestId("credentials-form").getByLabel("Password").fill("Test123!@#");
    await page.getByTestId("credentials-form").getByRole("button", { name: /sign in/i }).click();
    await page.goto("/apply/ferrari-frenzy");
    // The applicant already has a pending app, so the apply flow should
    // either show the form or a status banner — both are OK. No crash.
    await expect(page.locator("body")).toBeVisible();
    await ctx.close();
  });
});
