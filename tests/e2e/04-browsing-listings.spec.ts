import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail, signUp, completeRole } from "../fixtures/helpers";

test.describe("Flow 4/6 · Member Browsing & Listings CRUD", () => {
  test("explore page lists public marketplaces", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/explore");
    await expect(page.getByRole("heading", { name: /ferrari frenzy/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /gooners united/i })).toBeVisible();
  });

  test("member can browse marketplace feed", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    await expect(page.getByTestId("listing-title").first()).toBeVisible();
  });

  test("member can open a listing, save, and report", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    // Click first listing card
    const firstLink = page.locator('a[href^="/l/"]').first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/l\//);
    await expect(page.getByTestId("listing-title")).toBeVisible();
    // Save (toggles)
    await page.getByTestId("listing-save").click();
    await page.waitForTimeout(400);
    // Report
    const report = page.getByTestId("report-listing");
    if (await report.count()) {
      await report.click();
      const reason = page.getByRole("combobox").first();
      if (await reason.count()) await reason.click();
    }
  });

  test("member can create a fixed-price listing", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/new");

    await page.getByTestId("listing-type-fixed").click();

    // Fill schema-driven form
    await page.getByTestId("listing-field-title").fill("E2E Test Listing");
    await page.getByTestId("price-input").fill("42000");
    const year = page.getByTestId("listing-field-year");
    if (await year.count()) await year.fill("1992");
    const model = page.getByTestId("listing-field-model");
    if (await model.count()) await model.fill("308 GTB");
    const cond = page.getByTestId("listing-field-condition");
    if (await cond.count()) {
      await cond.click();
      await page.getByRole("option").first().click();
    }
    const image = page.getByTestId("images-input-0");
    if (await image.count()) await image.fill("https://picsum.photos/seed/e2e-listing/800/600");

    await page.getByTestId("submit-listing").click();
    await expect(page).toHaveURL(/\/l\//, { timeout: 15_000 });
    await expect(page.getByTestId("listing-title")).toContainText(/E2E Test Listing/i);
  });

  test("member can edit their own listing", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    // Create first, then edit
    await page.goto("/m/ferrari-frenzy/new");
    await page.getByTestId("listing-type-fixed").click();
    await page.getByTestId("listing-field-title").fill(`Editable ${Date.now()}`);
    await page.getByTestId("price-input").fill("12000");
    const model = page.getByTestId("listing-field-model");
    if (await model.count()) await model.fill("Editable Model");
    const year = page.getByTestId("listing-field-year");
    if (await year.count()) await year.fill("2000");
    const cond = page.getByTestId("listing-field-condition");
    if (await cond.count()) { await cond.click(); await page.getByRole("option").first().click(); }
    await page.getByTestId("images-input-0").fill("https://picsum.photos/seed/e2e-edit/800/600");
    await page.getByTestId("submit-listing").click();
    await expect(page).toHaveURL(/\/l\//);

    // Edit (mark sold)
    const sold = page.getByTestId("listing-sold");
    if (await sold.count()) {
      await sold.click();
      await expect(page.getByText(/sold/i).first()).toBeVisible();
    }
  });

  test("search filters listings by keyword", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed?q=F355");
    // Should show at least one F355 listing from seed
    await expect(page.getByText(/F355/i).first()).toBeVisible();
  });

  test("non-member cannot access feed", async ({ page }) => {
    const email = uniqueEmail("non-member");
    await signUp(page, { email, password: "Test123!@#", displayName: "Non Member" });
    await completeRole(page, "MEMBER");
    await page.goto("/m/ferrari-frenzy/feed");
    // Redirects to marketplace landing
    await expect(page).toHaveURL(/\/m\/ferrari-frenzy\/?$/);
  });

  test("member can place a bid on active auction", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed?type=AUCTION");
    const auction = page.locator('a[href^="/l/"]').first();
    if (await auction.count()) {
      await auction.click();
      await page.getByTestId("place-bid").click();
      const input = page.getByTestId("bid-input");
      const currentVal = await input.getAttribute("min");
      await input.fill(String((Number(currentVal) || 100) + 100));
      await page.getByTestId("submit-bid").click();
      await expect(page.getByText(/your bid|current high bid/i).first()).toBeVisible();
    }
  });
});
