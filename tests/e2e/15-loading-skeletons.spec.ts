import { expect, test, type Page } from "@playwright/test";
import { signIn } from "../fixtures/helpers";

/**
 * Loading skeletons — every async server-rendered surface should show a
 * route-level loading.tsx fallback while it suspends. We force the skeleton
 * to be visible long enough to assert by intercepting the destination
 * RSC navigation fetch and delaying its response.
 *
 * App Router only issues an RSC fetch (with `RSC: 1` header) for
 * client-side navigations — i.e. clicks on <Link>. Hard navigations via
 * page.goto stream the HTML directly, and the skeleton may flash too
 * briefly to assert. So every test here navigates by clicking real links.
 */

const SKELETON_DELAY_MS = 1500;

async function delayRsc(page: Page, urlGlob: string) {
  await page.route(urlGlob, async (route) => {
    if (route.request().headers()["rsc"] === "1") {
      await new Promise((r) => setTimeout(r, SKELETON_DELAY_MS));
    }
    await route.continue();
  });
}

test.describe("Loading skeletons render while async pages suspend", () => {
  test("home dashboard shows the skeleton during navigation", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/explore");
    await delayRsc(page, "**/home*");
    await page.getByTestId("navbar-brand").click();
    await expect(page.getByTestId("home-skeleton")).toBeVisible();
    // Real dashboard takes over once data resolves.
    await expect(page.locator(".dash, .sd-wrap")).toBeVisible();
  });

  test("explore page renders explore-skeleton during nav", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await delayRsc(page, "**/explore*");
    await page.locator(".nav-links").getByRole("link", { name: /explore/i }).click();
    await expect(page.getByTestId("explore-skeleton")).toBeVisible();
  });

  test("activity page renders activity-skeleton during nav", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await delayRsc(page, "**/activity*");
    await page.locator(".nav-links").getByRole("link", { name: /dashboard/i }).click();
    await expect(page.getByTestId("activity-skeleton")).toBeVisible();
  });

  test("messages page renders messages-skeleton during nav", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await delayRsc(page, "**/messages*");
    await page.getByLabel(/messages/i).first().click();
    await expect(page.getByTestId("messages-skeleton")).toBeVisible();
  });

  test("search page renders search-skeleton during nav", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await delayRsc(page, "**/search*");
    // The search chip in the navbar is the only <a class="search"> on /home.
    await page.locator("a.search").first().click();
    await expect(page.getByTestId("search-skeleton")).toBeVisible();
  });

  test("owner shell shows owner skeletons during sidebar nav", async ({ page }) => {
    // owner@shouks.test owns multiple marketplaces, so they don't auto-redirect.
    await signIn(page, "owner@shouks.test", "Test123!@#");
    // Block prefetch RSC requests for the sidebar's destinations so the
    // App Router cache stays empty. When we click, a fresh RSC fetch is
    // issued — and we delay that one to give loading.tsx time to render.
    await page.route("**/owner/ferrari-frenzy/listings**", async (route) => {
      const isPrefetch = route.request().headers()["next-router-prefetch"] === "1";
      if (isPrefetch) {
        await route.fulfill({ status: 204, body: "" });
        return;
      }
      if (route.request().headers()["rsc"] === "1") {
        await new Promise((r) => setTimeout(r, SKELETON_DELAY_MS));
      }
      await route.continue();
    });
    await page.goto("/owner/ferrari-frenzy/dashboard");
    await expect(page.getByTestId("owner-sidebar")).toBeVisible();
    await page
      .getByTestId("owner-sidebar")
      .getByRole("link", { name: /^listings$/i })
      .click();
    await expect(page.getByTestId("listings-skeleton")).toBeVisible();
  });
});
