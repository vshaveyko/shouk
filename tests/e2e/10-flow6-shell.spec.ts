import { expect, test } from "@playwright/test";
import { signIn } from "../fixtures/helpers";

/**
 * Flow 6 — Core App Shell (member, desktop). These tests pin the ported
 * design HTML structure so future edits can map 1:1 to
 * `design_handoff_shouks_mvp/Flow 6 - Core App Shell.html`.
 *
 * We assert presence of the design's scoped body-class wrappers and the
 * headline sections inside each. They intentionally do NOT assert exact
 * text/data counts — only that the shell shape matches the design.
 */

test.describe("Flow 6 · Core app shell — visual structure", () => {
  test("6A dashboard has welcome-strip, mp-row, dash-two (feed + side-stack)", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home");
    await expect(page.locator(".dash")).toBeVisible();
    await expect(page.locator(".welcome-strip")).toBeVisible();
    // Scope pills (All / Owner / Member)
    await expect(page.locator(".mp-filter .scope")).toBeVisible();
    // Horizontal marketplace row
    await expect(page.locator(".mp-row")).toBeVisible();
    await expect(page.locator(".mp-row .mp-chip").first()).toBeVisible();
    // Two-column layout: feed + side-stack
    await expect(page.locator(".dash-two")).toBeVisible();
    await expect(page.locator(".dash-two .feed")).toBeVisible();
    await expect(page.locator(".dash-two .side-stack")).toBeVisible();
    // Feed header + scope
    await expect(page.locator(".feed .feed-head h2")).toContainText(/new in your marketplaces/i);
  });
});
