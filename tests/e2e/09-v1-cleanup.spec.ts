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
});
