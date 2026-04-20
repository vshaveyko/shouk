import { expect, Page } from "@playwright/test";

/**
 * Shared E2E helpers. Tests run sequentially against a single server +
 * seeded DB. Each test workflow logs in a fresh user (or uses the pre-seeded
 * one) and the suite resets state via the reset endpoint as needed.
 */

export const USERS = {
  owner: { email: "owner@shouks.test", password: "Test123!@#", name: "Marcus Owner" },
  member: { email: "member@shouks.test", password: "Test123!@#", name: "Sasha Member" },
  reviewer: { email: "reviewer@shouks.test", password: "Test123!@#", name: "Riley Reviewer" },
  applicant: { email: "applicant@shouks.test", password: "Test123!@#", name: "Jane Applicant" },
} as const;

export async function signUp(
  page: Page,
  { email, password, displayName }: { email: string; password: string; displayName: string },
) {
  await page.goto("/signup");
  await page.getByTestId("signup-form").getByLabel("Display name").fill(displayName);
  await page.getByTestId("signup-form").getByLabel("Email").fill(email);
  await page.getByTestId("signup-form").getByLabel("Password").fill(password);
  await page.getByTestId("signup-form").getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/onboarding\/role/);
}

export async function signIn(page: Page, email: string, password: string, expectedUrl: RegExp = /\/home/) {
  await page.goto("/signin");
  await page.getByTestId("credentials-form").getByLabel("Email").fill(email);
  await page.getByTestId("credentials-form").getByLabel("Password").fill(password);
  await page.getByTestId("credentials-form").getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(expectedUrl);
}

export async function signOut(page: Page) {
  await page.getByTestId("user-menu").click();
  await page.getByTestId("sign-out").click();
  await expect(page).toHaveURL(/\/$|\/signin/);
}

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@shouks.test`;
}

export async function completeRole(page: Page, role: "MEMBER" | "OWNER") {
  await page.getByTestId(role === "OWNER" ? "role-owner" : "role-member").click();
  await page.getByTestId("continue-role").click();
  if (role === "OWNER") {
    await expect(page).toHaveURL(/\/owner\/create/);
  } else {
    await expect(page).toHaveURL(/\/home/);
  }
}

export async function linkVerification(page: Page, provider: "google" | "facebook" | "instagram" | "linkedin" | "twitter") {
  await page.getByTestId(`link-${provider}`).click();
  await expect(page.getByTestId(`verify-row-${provider}`).getByText(/linked|verified/i).first()).toBeVisible({ timeout: 5000 });
}
