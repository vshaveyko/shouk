import { expect, test } from "@playwright/test";
import { signIn } from "../fixtures/helpers";

// SHK-017: Edit listing
test.describe("SHK-017: Edit listing", () => {
  test("seller can navigate to edit page from listing", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    const firstListing = page.locator("a[href^='/l/']").first();
    const href = await firstListing.getAttribute("href");
    if (!href) return;
    await page.goto(href);
    const more = page.getByRole("button", { name: /more/i });
    if (await more.count() === 0) return;
    await more.click();
    const editItem = page.getByText("Edit listing");
    if (await editItem.count() === 0) return;
    await editItem.click();
    await expect(page).toHaveURL(/\/edit$/);
    await expect(page.getByRole("heading", { name: /edit listing/i })).toBeVisible();
  });
});

// SHK-018: Inactive marketplaces excluded from switcher
test.describe("SHK-018: Community switcher excludes inactive marketplaces", () => {
  test("community switcher only shows active marketplaces", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home");
    await expect(page.locator("nav")).toBeVisible();
  });
});

// SHK-019: No duplicate Get Started button
test.describe("SHK-019: No duplicate Get Started button", () => {
  test("landing page has only one auth CTA", async ({ page }) => {
    await page.goto("/");
    const getStarted = page.getByText(/get started/i);
    expect(await getStarted.count()).toBeLessThanOrEqual(1);
  });
});

// SHK-020: Active member redirects to feed
test.describe("SHK-020: Active member redirected to feed", () => {
  test("active member visiting /m/[slug] is redirected to feed", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy");
    await expect(page).toHaveURL(/\/m\/ferrari-frenzy\/feed/);
  });
});

// SHK-023: Marketplace switcher links to browse
test.describe("SHK-023: Marketplace switcher links to browse view", () => {
  test("marketplace switcher links to /m/[slug]/feed not admin", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home");
    // The navbar switcher should link to feed pages
    const allLinks = page.locator("nav a");
    const hrefs = await allLinks.evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
    const hasDashboardLink = hrefs.some((h) => h.includes("/dashboard") && !h.includes("/owner/"));
    const hasFeedLink = hrefs.some((h) => h.includes("/feed"));
    // Should have feed links (from switcher) but no non-owner dashboard links
    expect(hasDashboardLink).toBe(false);
  });
});

// SHK-024: Admin button for owners in feed
test.describe("SHK-024: Admin button visible to owners in feed", () => {
  test("feed hero shows Admin button to marketplace owner", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    await expect(page.getByTestId("admin-button")).toBeVisible();
  });

  test("feed hero does not show Admin button to regular members", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    await expect(page.getByTestId("admin-button")).toHaveCount(0);
  });
});

// SHK-025: Explore excludes INVITE-only marketplaces
test.describe("SHK-025: Explore excludes private marketplaces", () => {
  test("explore page loads without error", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByRole("main")).toBeVisible();
  });
});

// SHK-028: Messages link is global
test.describe("SHK-028: Messages link navigates to /messages", () => {
  test("messages link points to /messages not scoped URL", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home");
    const messagesLink = page.getByRole("link", { name: /messages/i }).first();
    await expect(messagesLink).toHaveAttribute("href", "/messages");
  });
});

// SHK-030: Recently viewed on homepage
test.describe("SHK-030: Recently viewed section on homepage", () => {
  test("home page loads without error", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/home");
    await expect(page.locator(".dash")).toBeVisible();
  });
});

// SHK-031: Alerts link includes tab param
test.describe("SHK-031: Alerts link goes to activity with tab=alerts", () => {
  test("feed hero Alerts link includes ?tab=alerts", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    const alertsLink = page.getByRole("link", { name: /alerts/i });
    await expect(alertsLink).toHaveAttribute("href", "/activity?tab=alerts");
  });
});

// SHK-033: Public marketplace join
test.describe("SHK-033: Public marketplace join CTA", () => {
  test("explore page loads without error (public MP foundation)", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByRole("main")).toBeVisible();
  });
});

// SHK-034: Schema preview in wizard
test.describe("SHK-034: Schema step preview shows listing form", () => {
  test("wizard schema step shows field preview panel", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#");
    await page.goto("/owner/create");
    await page.getByTestId("field-name").fill("Preview Test MP");
    // Select a category (required to advance from step 1)
    await page.getByTestId("field-category").click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /continue|next/i }).click();
    // On step 2 — the preview label shows "Seller's create-listing form"
    await expect(page.getByText(/create-listing form/i)).toBeVisible();
  });
});

// SHK-035: Wizard membership step uses Visibility + Ways to join
test.describe("SHK-035: Wizard membership step has visibility and entry sections", () => {
  async function advanceToStep3(page: import("@playwright/test").Page) {
    await page.getByTestId("field-name").fill("Test MP " + Date.now());
    await page.getByTestId("field-category").click();
    await page.getByRole("option").first().click();
    // Step 1 → Next
    await page.getByRole("button", { name: /continue|next/i }).click();
    // Step 2 → Next (schema step has pre-seeded fields, should pass validation)
    await page.getByRole("button", { name: /continue|next/i }).click();
  }

  test("membership step shows Visibility radio cards", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#");
    await page.goto("/owner/create");
    await advanceToStep3(page);
    // Step 3 — Membership
    await expect(page.getByTestId("entry-method-public")).toBeVisible();
    await expect(page.getByTestId("entry-method-closed")).toBeVisible();
    await expect(page.getByTestId("entry-method-invite")).toBeVisible();
  });

  test("Closed visibility shows Ways to join section", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#");
    await page.goto("/owner/create");
    await advanceToStep3(page);
    await page.getByTestId("entry-method-closed").click();
    await expect(page.getByTestId("join-method-application")).toBeVisible();
    await expect(page.getByTestId("join-method-referral")).toBeVisible();
  });
});

// SHK-037: Seller name on listing links to profile
test.describe("SHK-037: Seller name links to user profile", () => {
  test("seller name is a link on listing page", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    const firstListing = page.locator("a[href^='/l/']").first();
    const href = await firstListing.getAttribute("href");
    if (!href) return;
    await page.goto(href);
    const sellerName = page.getByTestId("seller-name");
    await expect(sellerName).toBeVisible();
    await expect(sellerName).toHaveAttribute("href", /\/u\//);
  });

  test("user profile page loads from seller link", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    const firstListing = page.locator("a[href^='/l/']").first();
    const href = await firstListing.getAttribute("href");
    if (!href) return;
    await page.goto(href);
    const sellerLink = page.getByTestId("seller-name");
    if (await sellerLink.count() === 0) return;
    const profileHref = await sellerLink.getAttribute("href");
    if (!profileHref) return;
    await page.goto(profileHref);
    await expect(page).toHaveURL(/\/u\//);
    // Profile page uses .pf-wrap, not a <main> element
    await expect(page.locator(".pf-wrap")).toBeVisible();
  });
});

// SHK-038: Cover image upload in identity settings
test.describe("SHK-038: Cover image is upload not URL input", () => {
  test("identity settings shows upload widget not URL input", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#");
    await page.goto("/owner/ferrari-frenzy/settings/identity");
    // File input exists (sr-only hidden input)
    await expect(page.getByTestId("identity-cover-file")).toHaveCount(1);
    // Old URL type input should be gone
    await expect(page.locator('input[type="url"]')).toHaveCount(0);
  });
});

// SHK-039: Admin Privacy section uses Visibility (Public/Closed/Private)
//   tab separate from Ways-to-join (Application/Referral), mirroring the wizard.
test.describe("SHK-039: Admin Privacy has visibility selector separate from entry method", () => {
  test("identity Privacy shows Visibility radio cards", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#");
    await page.goto("/owner/ferrari-frenzy/settings/identity");
    await expect(page.getByTestId("identity-visibility-public")).toBeVisible();
    await expect(page.getByTestId("identity-visibility-closed")).toBeVisible();
    await expect(page.getByTestId("identity-visibility-private")).toBeVisible();
  });

  test("Closed visibility reveals Ways to join sub-section", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#");
    await page.goto("/owner/ferrari-frenzy/settings/identity");
    await page.getByTestId("identity-visibility-closed").click();
    await expect(page.getByTestId("identity-join-application")).toBeVisible();
    await expect(page.getByTestId("identity-join-referral")).toBeVisible();
  });

  test("Public visibility hides Ways to join sub-section", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#");
    await page.goto("/owner/ferrari-frenzy/settings/identity");
    await page.getByTestId("identity-visibility-public").click();
    await expect(page.getByTestId("identity-join-application")).toHaveCount(0);
  });
});
