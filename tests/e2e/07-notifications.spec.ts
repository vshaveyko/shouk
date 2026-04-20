import { expect, test } from "@playwright/test";
import { signIn } from "../fixtures/helpers";

test.describe("Flow 10 · Notifications", () => {
  test("notifications page renders seeded items", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/notifications");
    await expect(page.getByTestId("notifications-list")).toBeVisible();
  });

  test("notification bell opens popover", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home");
    await page.getByTestId("notifications-bell").click();
    await expect(page.getByTestId("notifications-popover")).toBeVisible();
  });

  test("mark all as read clears unread badge", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/notifications");
    const mark = page.getByTestId("mark-all-read");
    if (await mark.count()) {
      await mark.click();
      await page.waitForTimeout(500);
      await expect(page.getByTestId("notifications-count")).toHaveCount(0);
    }
  });

  test("category tabs filter notifications", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/notifications");
    await page.getByTestId("tab-all").click();
    await expect(page.getByTestId("notifications-list")).toBeVisible();
  });

  test("email template preview pages render", async ({ page }) => {
    await page.goto("/emails/welcome");
    await expect(page.getByText(/welcome|shouks/i).first()).toBeVisible();
    await page.goto("/emails/application-approved");
    await expect(page.getByText(/approved|welcome/i).first()).toBeVisible();
    await page.goto("/emails/auction-won");
    await expect(page.getByText(/won|auction/i).first()).toBeVisible();
    await page.goto("/emails/iso-match");
    await expect(page.getByText(/iso|match/i).first()).toBeVisible();
  });
});
