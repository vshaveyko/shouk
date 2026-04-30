import { expect, test, Page, APIRequestContext } from "@playwright/test";
import { signIn, USERS } from "../fixtures/helpers";

/**
 * WhatsApp integration — exercises setup/verify/join flows end-to-end using
 * two test-only endpoints that bypass Puppeteer + seed needed DB state:
 *   - POST /api/whatsapp/test-inject   → seed an authenticated WA session
 *   - POST /api/whatsapp/test-reset    → set marketplace WA fields + clear
 *                                        a user's applications/membership
 *
 * Gated by WHATSAPP_ENABLED=true + WHATSAPP_TEST_INJECT=1 in playwright.config.ts.
 */

const GROUP = {
  id: "120363000000000001@g.us",
  name: "Ferrari Frenzy WA",
  memberCount: 12,
};

async function resetWaState(
  request: APIRequestContext,
  opts: {
    whatsapp?: { groupId: string | null; groupName: string | null; autoApproval: boolean };
    clearApplicantEmail?: string;
  },
) {
  const res = await request.post("/api/whatsapp/test-reset", {
    data: { slug: "ferrari-frenzy", ...opts },
  });
  expect(res.ok()).toBeTruthy();
}

/** Intercept the modal's "create session" call, redirect it to test-inject. */
async function stubSession(
  page: Page,
  fixture: {
    phone: string;
    groups: { id: string; name: string; isAdmin: boolean; memberCount: number }[];
  },
) {
  await page.route("**/api/whatsapp/session", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const res = await page.request.post("/api/whatsapp/test-inject", { data: fixture });
    const body = await res.json();
    await route.fulfill({
      status: res.status(),
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

test.describe("WhatsApp integration", () => {
  test("owner links a WhatsApp group from the Integrations tab", async ({
    page,
    request,
  }) => {
    await resetWaState(request, {
      whatsapp: { groupId: null, groupName: null, autoApproval: false },
    });
    await signIn(page, USERS.owner.email, USERS.owner.password);
    await stubSession(page, {
      phone: "+15551234567",
      groups: [{ ...GROUP, isAdmin: true }],
    });

    await page.goto("/owner/ferrari-frenzy/settings/integrations");
    await expect(page.getByTestId("settings-tab-integrations")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.getByTestId("whatsapp-link-button").click();

    await expect(page.getByTestId("whatsapp-modal")).toBeVisible();
    const groupRow = page.getByTestId(`whatsapp-group-${GROUP.id}`);
    await expect(groupRow).toBeVisible({ timeout: 15_000 });
    await groupRow.click();
    await page.getByTestId("whatsapp-setup-confirm").click();

    await expect(page.getByTestId("whatsapp-linked-card")).toBeVisible();
    await expect(page.getByTestId("whatsapp-linked-badge")).toBeVisible();
    await expect(
      page.getByTestId("whatsapp-linked-card").getByText(GROUP.name),
    ).toBeVisible();
  });

  test("owner toggles auto-approval on the linked group", async ({
    page,
    request,
  }) => {
    await resetWaState(request, {
      whatsapp: { groupId: GROUP.id, groupName: GROUP.name, autoApproval: false },
    });
    await signIn(page, USERS.owner.email, USERS.owner.password);
    await page.goto("/owner/ferrari-frenzy/settings/integrations");

    const toggle = page.getByTestId("whatsapp-auto-approval");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  test("applicant verifies membership via WhatsApp and is auto-approved", async ({
    page,
    request,
  }) => {
    await resetWaState(request, {
      whatsapp: { groupId: GROUP.id, groupName: GROUP.name, autoApproval: true },
      clearApplicantEmail: USERS.applicant.email,
    });

    await signIn(page, USERS.applicant.email, USERS.applicant.password);
    await stubSession(page, {
      phone: "+15559991234",
      groups: [{ ...GROUP, isAdmin: false }],
    });

    await page.goto("/apply/ferrari-frenzy");
    await expect(page.getByTestId("whatsapp-verify-card")).toBeVisible();
    await page.getByTestId("whatsapp-verify-open").click();
    await expect(page.getByTestId("whatsapp-modal")).toBeVisible();

    await expect(page).toHaveURL(/\/m\/ferrari-frenzy/, { timeout: 20_000 });
  });

  test("home shows Join via WhatsApp and completes", async ({ page, request }) => {
    await resetWaState(request, {
      whatsapp: { groupId: GROUP.id, groupName: GROUP.name, autoApproval: true },
    });

    await signIn(page, USERS.member.email, USERS.member.password);
    await stubSession(page, {
      phone: "+15552223333",
      groups: [{ ...GROUP, isAdmin: false }],
    });

    await page.goto("/home");
    await page.getByTestId("whatsapp-join-button").click();
    await expect(page.getByTestId("whatsapp-modal")).toBeVisible();
    // Member is already in Ferrari Frenzy — flow should complete & close modal.
    await expect(page.getByTestId("whatsapp-modal")).toBeHidden({ timeout: 20_000 });
  });
});
