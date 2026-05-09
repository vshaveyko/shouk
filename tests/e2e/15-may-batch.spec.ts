import { expect, test } from "@playwright/test";
import { signIn } from "../fixtures/helpers";

// Batch of small fixes pulled from the May 2026 sprint of SHK-060+
// items. Each test is labeled with its tracker ID.

test.describe("May 2026 batch", () => {
  test.beforeAll(async ({ request }) => {
    await request.post("/api/e2e-reset");
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
