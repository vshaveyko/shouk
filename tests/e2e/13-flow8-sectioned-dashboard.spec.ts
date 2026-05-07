import { expect, test } from "@playwright/test";
import { signIn } from "../fixtures/helpers";

/**
 * Flow 8 — Sectioned Dashboard.
 *
 * Gated behind the Shipeasy `sectioned_dashboard` feature gate at /home.
 * URL override `?se_ks_sectioned_dashboard=true` flips the flag for the
 * request. Without it the existing Flow 6A dashboard renders. Source design:
 * design_handoff_shouks_mvp/Flow 8 - Sectioned Dashboard.html.
 *
 * The sectioned dashboard pulls every row from Prisma (loadDashboardData):
 * Listings · Active/Drafts/Sold come from `Listing` by sellerId/status; ISO
 * Open/Closed come from `Listing` where type=ISO; ISO Matches and Alerts
 * Matches come from `Notification`; Alerts · Active comes from `SavedSearch`.
 * Empty sub-tabs render an animated illustration + copy per the design notes.
 */

test.describe("Flow 8 · Sectioned dashboard — flag-gated", () => {
  test("default — flag off renders existing Flow 6A dashboard", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home");
    await expect(page.locator(".welcome-strip")).toBeVisible();
    await expect(page.locator(".dash-two")).toBeVisible();
    await expect(page.locator(".sb-section[data-section='listings']")).toHaveCount(0);
  });

  test("flag on — renders sectioned dashboard with real seeded listings", async ({ page, request }) => {
    // Reset any listings the prior tests in this run created against the
    // shared DB so the assertions below see only seeded data.
    await request.post("/api/e2e-reset", { data: { resetListings: true } });

    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home?se_ks_sectioned_dashboard=true");

    // Page header
    await expect(page.locator(".ah h1")).toHaveText(/^Dashboard$/);

    // Sidebar — four sections
    await expect(page.locator(".sb-section[data-section='listings']")).toBeVisible();
    await expect(page.locator(".sb-section[data-section='iso']")).toBeVisible();
    await expect(page.locator(".sb-section[data-section='alerts']")).toBeVisible();
    await expect(page.locator(".sb-section[data-section='purchases']")).toBeVisible();

    // Sasha (member) seeded with 2 active listings (1992 512 TR + Vintage scarf)
    const activeRows = page.locator(".sub-panel[data-sub-panel='listings-active'] .lr-row");
    await expect(activeRows).toHaveCount(2);
    await expect(activeRows.first()).toContainText(/512 TR|Arsenal Scarf/);

    // Sidebar count reflects real total (active=2, drafts=0, sold=0 → 2)
    await expect(
      page.locator(".sb-section[data-section='listings'] .sb-head .ct"),
    ).toHaveText("2");
    await expect(
      page.locator(".sb-sub[data-sub='listings-active'] .ct-mini"),
    ).toHaveText("2");
  });

  test("flag on — empty Drafts sub-tab renders animated empty state", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home?se_ks_sectioned_dashboard=true");

    await page.locator(".sb-sub[data-sub='listings-drafts']").click();

    const empty = page.locator(".sub-panel[data-sub-panel='listings-drafts'] [data-testid='empty-state']");
    await expect(empty).toBeVisible();
    await expect(empty.locator(".es-title")).toHaveText("No drafts");
    await expect(empty.locator(".es-art")).toBeVisible();
  });

  test("flag on — ISO Matches surfaces seeded ISO_MATCH notification", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home?se_ks_sectioned_dashboard=true");

    await page.locator(".sb-section[data-section='iso'] .sb-head").click();
    await page.locator(".sb-sub[data-sub='iso-matches']").click();

    // Sasha's seed includes 1 ISO_MATCH notification
    const matchRows = page.locator(".sub-panel[data-sub-panel='iso-matches'] .match-group .lr-row");
    await expect(matchRows.first()).toBeVisible();
    await expect(matchRows.first()).toContainText(/Marco C\.|Testarossa/);
  });

  test("flag on — sidebar carets indicate and toggle expanded state", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home?se_ks_sectioned_dashboard=true");

    // Every expandable section (Listings/ISO/Alerts) renders a caret icon in
    // its head. Purchases has no sub-tabs so it does not render a caret.
    for (const section of ["listings", "iso", "alerts"]) {
      await expect(
        page.locator(`.sb-section[data-section='${section}'] .sb-head .caret`),
      ).toBeVisible();
    }
    await expect(
      page.locator(".sb-section[data-section='purchases'] .sb-head .caret"),
    ).toHaveCount(0);

    // The default-active section is "listings" — its caret is in the open
    // state and the others are collapsed.
    await expect(
      page.locator(".sb-section[data-section='listings'] .sb-head"),
    ).toHaveClass(/active/);
    await expect(
      page.locator(".sb-section[data-section='iso']"),
    ).not.toHaveClass(/active/);

    // Clicking the ISO section head toggles its caret to the open state.
    await page.locator(".sb-section[data-section='iso'] .sb-head").click();
    await expect(
      page.locator(".sb-section[data-section='iso']"),
    ).toHaveClass(/active/);
    await expect(
      page.locator(".sb-section[data-section='listings']"),
    ).not.toHaveClass(/active/);
  });

  test("flag on — full-bleed layout with list-only scroll", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home?se_ks_sectioned_dashboard=true");

    // Page itself should not scroll past the viewport — the dashboard fills
    // the area below the navbar and only the middle pane scrolls when its
    // content overflows. We verify by checking the document body is no
    // taller than the window (within 1px tolerance for fractional pixels).
    const overflow = await page.evaluate(() => ({
      docHeight: document.documentElement.scrollHeight,
      viewport: window.innerHeight,
      paneListOverflow: getComputedStyle(document.querySelector(".pane-list") as Element).overflowY,
      sbOverflow: getComputedStyle(document.querySelector(".sb") as Element).overflowY,
    }));
    expect(overflow.docHeight).toBeLessThanOrEqual(overflow.viewport + 1);
    expect(overflow.paneListOverflow).toMatch(/auto|scroll/);
    expect(overflow.sbOverflow).toMatch(/auto|scroll|hidden/);
  });

  test("flag on — Purchases is an empty state (schema does not track buys)", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home?se_ks_sectioned_dashboard=true");

    await page.locator(".sb-section[data-section='purchases'] .sb-head").click();

    const empty = page.locator(".section-panel[data-section-panel='purchases'] [data-testid='empty-state']");
    await expect(empty).toBeVisible();
    await expect(empty.locator(".es-title")).toHaveText("No purchases yet");
  });
});
