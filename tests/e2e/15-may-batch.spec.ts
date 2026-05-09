import { expect, test } from "@playwright/test";
import { signIn } from "../fixtures/helpers";

// Batch of small fixes pulled from the May 2026 sprint of SHK-060+
// items. Each test is labeled with its tracker ID.

test.describe("May 2026 batch", () => {
  test.beforeAll(async ({ request }) => {
    await request.post("/api/e2e-reset");
  });

  // SHK-076 — favorited marketplaces should be visually marked. Show a
  // star indicator on the home Your-Marketplaces chip and on the navbar
  // switcher row.
  test("SHK-076: favorited marketplaces show a star on /home and in the switcher", async ({
    page,
  }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    // Make sure ferrari-frenzy is favorited regardless of prior state.
    await page.request.post("/api/marketplaces/ferrari-frenzy/favorite");
    try {
      await page.goto("/home?stay=1");
      const chip = page.getByTestId("marketplace-chip-ferrari-frenzy");
      await expect(chip).toBeVisible();
      await expect(chip.getByTestId("favorite-star")).toBeVisible();

      await page.getByTestId("marketplace-switcher").click();
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      const switcherRow = menu
        .getByRole("menuitem")
        .filter({ hasText: /ferrari frenzy/i })
        .first();
      await expect(switcherRow.getByTestId("favorite-star")).toBeVisible();
    } finally {
      await page.request.delete("/api/marketplaces/ferrari-frenzy/favorite");
    }
  });

  // SHK-077 — In the marketplace switcher each row should call out the
  // current user's role (Owner / Admin / Member).
  test("SHK-077: marketplace switcher shows the user's role on each row", async ({
    page,
  }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#");
    await page.goto("/home?stay=1");
    await page.getByTestId("marketplace-switcher").click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    const row = menu
      .getByRole("menuitem")
      .filter({ hasText: /ferrari frenzy/i })
      .first();
    await expect(row.getByTestId("role-pill")).toBeVisible();
    await expect(row.getByTestId("role-pill")).toHaveText(/owner/i);
  });

  // SHK-072 / SHK-078 — Recently viewed disappeared from /home for users
  // on the sectioned_dashboard flag. The legacy dashboard branch still
  // rendered <RecentlyViewedSection />, but the new branch returned
  // before reaching that block.
  test("SHK-072: Recently viewed renders on /home under the sectioned dashboard flag", async ({
    page,
  }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    // Visit a listing first so there's something to surface in the rail.
    const listingsRes = await page.request.get(
      "/api/marketplaces/ferrari-frenzy/listings",
    );
    const listings = (await listingsRes.json()) as Array<{ id: string }>;
    expect(listings.length).toBeGreaterThan(0);
    await page.goto(`/l/${listings[0].id}`);

    await page.goto("/home?se_ks_sectioned_dashboard=true");
    await expect(page.getByTestId("recently-viewed")).toBeVisible();
  });

  // SHK-073 — "New in your marketplaces" on /home was rendering prices
  // with maximumFractionDigits: 0, so $100.25 showed as "$100" and a
  // listing intentionally priced with cents (auction increments, parts
  // listings) appeared mispriced. Surface cents whenever they're present.
  test("SHK-073: New-in-your-marketplaces preserves cents in displayed prices", async ({
    page,
  }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    const title = `Cent test ${Date.now()}`;
    const create = await page.request.post(
      "/api/marketplaces/ferrari-frenzy/listings",
      {
        data: {
          title,
          type: "FIXED",
          priceCents: 10025,
          schemaValues: {},
          images: ["https://picsum.photos/seed/cents-test/400/300"],
        },
      },
    );
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as { id: string };

    try {
      await page.goto("/home");
      const card = page
        .getByTestId("feed-item")
        .filter({ hasText: title })
        .first();
      await expect(card).toBeVisible();
      await expect(card).toContainText("$100.25");
    } finally {
      await page.request.delete(`/api/listings/${created.id}`);
    }
  });

  // SHK-066 — drop the up/down spinner on price fields so a stray scroll
  // wheel can't bump the listed price. The real fix is to give the input
  // a non-`number` type with inputMode="decimal" so the numeric keyboard
  // still appears on mobile.
  test("SHK-066: price input on the new-listing form has no native number spinner", async ({
    page,
  }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/new");

    const price = page.getByTestId("price-input").first();
    await expect(price).toBeVisible();

    const type = await price.getAttribute("type");
    expect(type).not.toBe("number");
    const inputMode = await price.getAttribute("inputmode");
    expect(inputMode).toBe("decimal");
  });

  // SHK-070 — after the owner confirms the destructive action in the
  // Danger zone, they should land on /home instead of staying inside the
  // (now-inactive) admin shell.
  test("SHK-070: deactivating a marketplace navigates the owner to /home", async ({
    page,
    request,
  }) => {
    // Use a throwaway marketplace so we don't take down a seeded one for
    // the rest of the suite. Sign in as the seeded owner and create one
    // via the API.
    await signIn(page, "owner@shouks.test", "Test123!@#");
    const slug = `delete-test-${Date.now()}`;
    const create = await page.request.post("/api/marketplaces", {
      data: {
        slug,
        name: "Delete Test",
        category: "Cars",
        entryMethod: "PUBLIC",
        requiredVerifications: ["GOOGLE"],
        schemaFields: [
          {
            name: "title",
            label: "Title",
            type: "SHORT_TEXT",
            required: true,
          },
        ],
      },
    });
    expect(create.ok()).toBeTruthy();

    await page.goto(`/owner/${slug}/settings/identity`);
    await page.getByTestId("identity-deactivate").click();
    await page.getByTestId("identity-deactivate-confirm").click();

    await expect(page).toHaveURL(/\/home(\?|$)/);
  });

  // SHK-069 — Danger zone belongs at the bottom of the Identity tab.
  // Previously it was rendered inside IdentityForm but the page also
  // rendered RulesForm below IdentityForm, sandwiching the Danger zone
  // in the middle.
  test("SHK-069: Danger zone is the last card on the Identity settings tab", async ({
    page,
  }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#");
    await page.goto("/owner/ferrari-frenzy/settings/identity");

    const dangerHeading = page.getByText(/danger zone/i).first();
    await expect(dangerHeading).toBeVisible();
    const rulesHeading = page
      .getByRole("heading", { name: /verification|application questions|rules/i })
      .first();
    await expect(rulesHeading).toBeVisible();

    // Both have to be present; the danger heading must appear after the
    // rules heading vertically.
    const dangerBox = await dangerHeading.boundingBox();
    const rulesBox = await rulesHeading.boundingBox();
    expect(dangerBox).toBeTruthy();
    expect(rulesBox).toBeTruthy();
    expect(dangerBox!.y).toBeGreaterThan(rulesBox!.y);
  });
});
