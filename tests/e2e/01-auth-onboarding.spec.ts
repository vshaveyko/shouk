import { expect, test } from "@playwright/test";
import { signUp, signIn, signOut, uniqueEmail, completeRole } from "../fixtures/helpers";

test.describe("Flow 1 · Auth & Onboarding", () => {
  test("landing page renders brand, CTAs, featured marketplaces", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /own markets/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /browse marketplaces/i }).first()).toBeVisible();
  });

  test("sign up → role picker → home dashboard", async ({ page }) => {
    const email = uniqueEmail("auth");
    await signUp(page, { email, password: "Test123!@#", displayName: "New Tester" });
    await completeRole(page, "MEMBER");
    await expect(page.getByRole("heading", { name: "Your marketplaces", exact: true })).toBeVisible();
  });

  test("sign up choose owner → lands on create marketplace", async ({ page }) => {
    const email = uniqueEmail("owner");
    await signUp(page, { email, password: "Test123!@#", displayName: "Owner Tester" });
    await completeRole(page, "OWNER");
    await expect(page).toHaveURL(/\/owner\/create/);
  });

  test("sign in with seeded credentials works", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await expect(page.getByRole("heading", { name: "Your marketplaces", exact: true })).toBeVisible();
  });

  test("sign in with wrong password shows error", async ({ page }) => {
    await page.goto("/signin");
    await page.getByTestId("credentials-form").getByLabel("Email").fill("member@shouks.test");
    await page.getByTestId("credentials-form").getByLabel("Password").fill("wrong-password");
    await page.getByTestId("credentials-form").getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByTestId("signin-error")).toBeVisible();
  });

  test("sign up with duplicate email fails", async ({ page }) => {
    await page.goto("/signup");
    await page.getByTestId("signup-form").getByLabel("Display name").fill("Dup User");
    await page.getByTestId("signup-form").getByLabel("Email").fill("member@shouks.test");
    await page.getByTestId("signup-form").getByLabel("Password").fill("Test123!@#");
    await page.getByTestId("signup-form").getByRole("button", { name: /create account/i }).click();
    await expect(page.getByTestId("signup-error")).toBeVisible();
  });

  test("identity verification: link providers and verify phone", async ({ page }) => {
    const email = uniqueEmail("verify");
    await signUp(page, { email, password: "Test123!@#", displayName: "Verifier" });
    await completeRole(page, "MEMBER");

    await page.goto("/onboarding/verify");
    await page.getByTestId("link-google").click();
    await expect(page.getByTestId("verify-row-google").getByText(/@/)).toBeVisible();

    await page.getByTestId("link-facebook").click();
    await expect(page.getByTestId("verify-row-facebook").getByText(/jane|facebook/i)).toBeVisible();

    // Phone
    await page.getByTestId("phone-input").fill("+15551234567");
    await page.getByTestId("phone-send-code").click();
    await page.getByTestId("phone-code").fill("123456");
    await page.getByTestId("phone-verify").click();
    await expect(page.getByTestId("verify-row-phone").getByText(/\+15551234567/)).toBeVisible();

    await page.getByTestId("verify-continue").click();
    await expect(page).toHaveURL(/\/home/);
  });

  test("sign out returns user to landing/signin", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await signOut(page);
  });
});
