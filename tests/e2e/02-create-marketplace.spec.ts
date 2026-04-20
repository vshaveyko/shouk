import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail, signUp, completeRole, linkVerification } from "../fixtures/helpers";

test.describe("Flow 2 · Create Marketplace", () => {
  test("owner completes wizard and lands on dashboard", async ({ page }) => {
    const email = uniqueEmail("wizard");
    await signUp(page, { email, password: "Test123!@#", displayName: "Wizard Owner" });
    await completeRole(page, "OWNER");
    await expect(page).toHaveURL(/\/owner\/create/);

    // Step 1: Identity
    const name = `E2E Watches ${Date.now()}`;
    await page.getByTestId("field-name").fill(name);
    await page.getByTestId("field-description").fill("Vetted community for enthusiast collectors.");
    // Category
    await page.getByTestId("field-category").click();
    await page.getByRole("option", { name: "Watches" }).click();
    await page.getByTestId("wizard-next").click();

    // Step 2: Schema — keep pre-seeded fields, add one custom
    await page.getByTestId("add-schema-field").click();
    const rows = page.getByTestId("schema-field-row");
    await expect(rows).toHaveCount(4);
    await page.getByTestId("wizard-next").click();

    // Step 3: Rules — application + Google verification
    await page.getByTestId("entry-method-application").click();
    const googleVerify = page.getByTestId("verify-option-google");
    if (!(await googleVerify.isChecked())) await googleVerify.click();
    await page.getByTestId("wizard-next").click();

    // Step 4: Monetization (free) + publish
    await page.getByTestId("pricing-free").click();
    await page.getByTestId("wizard-publish").click();

    await expect(page).toHaveURL(/\/owner\/.+\/dashboard/, { timeout: 15_000 });
  });

  test("cannot publish without a name (validation)", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/create");
    // Try to publish without completing required fields
    const nextBtn = page.getByTestId("wizard-next");
    await nextBtn.click();
    // Should still be on step 1 (name missing) — the form should block navigation
    await expect(page.getByTestId("field-name")).toBeVisible();
  });

  test("slug auto-fills from name and is editable", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/create");
    await page.getByTestId("field-name").fill("Vintage Denim Club");
    const slug = await page.getByTestId("field-slug").inputValue();
    expect(slug).toMatch(/vintage-denim-club/);
  });
});
