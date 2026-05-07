import { expect, test } from "@playwright/test";
import { signIn } from "../fixtures/helpers";

/**
 * Flow 8 — Sectioned Dashboard.
 *
 * The sectioned dashboard at /home is gated behind the Shipeasy feature
 * gate `sectioned_dashboard`. Without the flag the existing Flow 6A
 * dashboard renders; with the flag (URL override `?se_ks_sectioned_dashboard=true`)
 * the four-pane sectioned layout renders. Source design:
 * design_handoff_shouks_mvp/Flow 8 - Sectioned Dashboard.html.
 */

test.describe("Flow 8 · Sectioned dashboard — flag-gated", () => {
  test("default — flag off renders existing Flow 6A dashboard", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home");
    await expect(page.locator(".welcome-strip")).toBeVisible();
    await expect(page.locator(".dash-two")).toBeVisible();
    // Sectioned layout must NOT be present
    await expect(page.locator(".sb-section[data-section='listings']")).toHaveCount(0);
  });

  test("flag on — renders sectioned dashboard with sidebar + list + detail panes", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home?se_ks_sectioned_dashboard=true");

    // Page header
    await expect(page.locator(".ah h1")).toHaveText(/^Dashboard$/);

    // Sidebar — four sections
    await expect(page.locator(".sb-section[data-section='listings']")).toBeVisible();
    await expect(page.locator(".sb-section[data-section='iso']")).toBeVisible();
    await expect(page.locator(".sb-section[data-section='alerts']")).toBeVisible();
    await expect(page.locator(".sb-section[data-section='purchases']")).toBeVisible();

    // Three-pane body
    await expect(page.locator(".pane-list")).toBeVisible();
    await expect(page.locator(".pane-detail")).toBeVisible();

    // Listings is active by default — its section panel is shown
    await expect(page.locator(".section-panel[data-section-panel='listings']")).toHaveClass(/active/);

    // Sub-tabs under Listings
    await expect(page.locator(".sb-sub[data-sub='listings-active']")).toBeVisible();
    await expect(page.locator(".sb-sub[data-sub='listings-drafts']")).toBeVisible();
    await expect(page.locator(".sb-sub[data-sub='listings-sold']")).toBeVisible();
  });

  test("flag on — clicking ISO sidebar section reveals its sub-tabs and panel", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home?se_ks_sectioned_dashboard=true");

    await page.locator(".sb-section[data-section='iso'] .sb-head").click();

    await expect(page.locator(".section-panel[data-section-panel='iso']")).toHaveClass(/active/);
    await expect(page.locator(".sb-sub[data-sub='iso-open']")).toBeVisible();
    await expect(page.locator(".sb-sub[data-sub='iso-matches']")).toBeVisible();
  });
});
