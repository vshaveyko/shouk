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
});
