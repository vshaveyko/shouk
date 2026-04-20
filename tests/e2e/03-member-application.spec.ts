import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail, signUp, completeRole } from "../fixtures/helpers";

test.describe("Flow 3 · Member Application", () => {
  test("public marketplace landing page renders", async ({ page }) => {
    await page.goto("/m/ferrari-frenzy");
    await expect(page.getByRole("heading", { name: /ferrari frenzy/i })).toBeVisible();
    await expect(page.getByText(/vehicles/i).first()).toBeVisible();
  });

  test("unauthenticated user clicking Apply is redirected to sign in", async ({ page }) => {
    await page.goto("/m/ferrari-frenzy");
    const apply = page.getByRole("link", { name: /apply/i });
    if (await apply.count()) {
      await apply.first().click();
      await expect(page).toHaveURL(/\/signin/);
    }
  });

  test("new user without required verifications is told to verify first", async ({ page }) => {
    const email = uniqueEmail("apply");
    await signUp(page, { email, password: "Test123!@#", displayName: "Apply Tester" });
    await completeRole(page, "MEMBER");
    // Ferrari Frenzy requires GOOGLE + FACEBOOK; fresh user has none
    await page.goto("/apply/ferrari-frenzy");
    await expect(page.getByTestId("verify-needed")).toBeVisible();
  });

  test("user with verifications can submit application and see pending state", async ({ page }) => {
    const email = uniqueEmail("apply-ok");
    await signUp(page, { email, password: "Test123!@#", displayName: "Complete Applicant" });
    await completeRole(page, "MEMBER");

    // Link required providers
    await page.goto("/onboarding/verify");
    await page.getByTestId("link-google").click();
    await page.getByTestId("link-facebook").click();
    await page.getByTestId("verify-continue").click();

    // Now apply
    await page.goto("/apply/ferrari-frenzy");
    await expect(page.getByTestId("apply-form")).toBeVisible();

    // Fill required questions (the form has a required LONG_TEXT question)
    const longText = page.getByTestId("apply-form").locator("textarea").first();
    if (await longText.count()) {
      await longText.fill("I've been collecting for 12 years.");
    }
    await page.getByTestId("apply-submit").click();

    // Redirects back to /m/[slug] with pending banner
    await expect(page).toHaveURL(/\/m\/ferrari-frenzy/, { timeout: 10_000 });
    await expect(page.getByText(/pending|under review|we'll let you know/i)).toBeVisible();
  });

  test("submitting a second application while pending shows error or is blocked", async ({ page }) => {
    await signIn(page, "applicant@shouks.test", "Test123!@#");
    await page.goto("/apply/ferrari-frenzy");
    // If the page shows pending status instead of form, assert that; otherwise submit & assert error
    const form = page.getByTestId("apply-form");
    if (await form.count()) {
      const longText = form.locator("textarea").first();
      if (await longText.count()) await longText.fill("Another application.");
      await page.getByTestId("apply-submit").click();
      await expect(page.getByTestId("apply-error")).toBeVisible();
    } else {
      await expect(page.getByText(/pending|already a member/i)).toBeVisible();
    }
  });
});
