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

  test("6B marketplace view has mp-hero, mp-tabs, mp-toolbar, listings-grid", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    await expect(page.locator(".mp-hero")).toBeVisible();
    await expect(page.locator(".mp-hero h1")).toContainText(/ferrari frenzy/i);
    await expect(page.locator(".mp-tabs")).toBeVisible();
    // Browse tab is active on the feed route
    await expect(page.locator('.mp-tabs button.active')).toContainText(/browse/i);
    await expect(page.locator(".mp-toolbar")).toBeVisible();
    await expect(page.locator(".listings-grid")).toBeVisible();
  });

  test("6C listing detail has ld split-pane with ld-left gallery and ld-right info", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    const firstCard = page.locator(".listings-grid .listing").first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/l\//);
    await expect(page.locator(".ld")).toBeVisible();
    await expect(page.locator(".ld .ld-left")).toBeVisible();
    await expect(page.locator(".ld .ld-right")).toBeVisible();
    await expect(page.locator(".ld .ld-main-img")).toBeVisible();
    // Serif H1 in the head block
    await expect(page.locator(".ld-head h1")).toBeVisible();
  });

  test("6D new listing has cl layout, cl-head, mode-toggle, and cl-right preview", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/new");
    await expect(page.locator(".cl")).toBeVisible();
    await expect(page.locator(".cl .cl-head h1")).toBeVisible();
    await expect(page.locator(".cl .mode-toggle")).toBeVisible();
    // Sell mode is on by default
    await expect(page.locator(".mode-toggle .mt-opt.on")).toContainText(/selling/i);
    // Sticky live preview on the right
    await expect(page.locator(".cl .cl-right .preview")).toBeVisible();
  });
});
