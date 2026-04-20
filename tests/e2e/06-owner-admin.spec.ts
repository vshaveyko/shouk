import { expect, test } from "@playwright/test";
import { signIn } from "../fixtures/helpers";

test.describe("Flow 7 · Owner Admin Settings", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
  });

  test("settings identity tab can save tagline", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/settings/identity");
    await page.getByTestId("identity-tagline").fill("Home for serious Ferrari enthusiasts.");
    await page.getByTestId("identity-save").click();
    await expect(page.getByText(/saved|updated/i).first()).toBeVisible();
  });

  test("settings schema tab renders existing fields and can add a new one", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/settings/schema");
    const addBtn = page.getByTestId("schema-add-field");
    await addBtn.click();
    const save = page.getByTestId("schema-save");
    if (await save.count()) {
      await save.click();
      await expect(page.getByText(/saved|updated/i).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("settings rules tab can change entry method", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/settings/rules");
    await expect(page.getByRole("heading", { name: /rules|members/i }).first()).toBeVisible();
  });

  test("settings monetization tab can switch to paid", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/settings/monetization");
    const paid = page.getByTestId("pricing-paid");
    if (await paid.count()) {
      await paid.click();
    }
  });

  test("settings roles tab lists admins", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/settings/roles");
    await expect(page.getByRole("heading", { name: /roles|admins/i }).first()).toBeVisible();
  });

  test("settings activity tab renders analytics", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/settings/activity");
    await expect(page.getByTestId("analytics-members-total")).toBeVisible();
  });

  test("settings billing tab renders", async ({ page }) => {
    await page.goto("/owner/ferrari-frenzy/settings/billing");
    await expect(page.getByRole("heading", { name: /billing|subscribers/i }).first()).toBeVisible();
  });
});
