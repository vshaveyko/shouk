import { expect, test } from "@playwright/test";
import { signIn } from "../fixtures/helpers";

test.describe("Flow 6E · Marketplace messaging", () => {
  test("global /messages redirects into the user's first marketplace", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/messages");
    await expect(page).toHaveURL(/\/m\/[^/]+\/messages$/);
    await expect(page.getByTestId("messages-root")).toBeVisible();
  });

  test("navbar 'Messages' link points at the active marketplace", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");
    const link = page.getByRole("link", { name: "Messages" });
    await expect(link).toHaveAttribute("href", "/m/ferrari-frenzy/messages");
    await link.click();
    await expect(page).toHaveURL(/\/m\/ferrari-frenzy\/messages/);
  });

  test("non-member of a marketplace is redirected away from messages", async ({ page }) => {
    // applicant is not an active member of ferrari-frenzy
    await signIn(page, "applicant@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/messages");
    await expect(page).not.toHaveURL(/\/m\/ferrari-frenzy\/messages/);
  });

  test("empty-state renders when a member has no threads yet", async ({ page }) => {
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/gooners-united/messages");
    await expect(page.getByTestId("messages-root")).toBeVisible();
    await expect(page.getByTestId("messages-empty")).toBeVisible();
  });

  test("member starts a thread from a listing and both sides see the conversation", async ({ page }) => {
    // --- Buyer: Sasha Member opens a listing sold by owner and messages them ---
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/feed");

    // Open first listing owned by someone else (seeded: F355 by owner)
    await page.getByRole("link", { name: /F355 Spider/i }).first().click();
    await expect(page).toHaveURL(/\/l\//);

    // Click "Message seller"
    const buyerMessage = `E2E hello ${Date.now()}`;
    await page.getByTestId("message-seller").click();
    await expect(page).toHaveURL(/\/m\/ferrari-frenzy\/messages/);

    // Compose form is auto-opened for the seller; send the first message.
    const composer = page.getByTestId("message-composer");
    await composer.fill(buyerMessage);
    await page.getByTestId("message-send").click();

    // Bubble shows up in the thread panel
    await expect(page.getByTestId("message-bubble").filter({ hasText: buyerMessage })).toBeVisible();

    // Thread appears in the sidebar list
    await expect(page.getByTestId("thread-row").first()).toBeVisible();

    // --- Seller: Marcus Owner signs in, sees the thread, replies ---
    await page.context().clearCookies();
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/home/);
    await page.goto("/m/ferrari-frenzy/messages");

    const threadRow = page.getByTestId("thread-row").filter({ hasText: /Sasha/i }).first();
    await expect(threadRow).toBeVisible();
    await threadRow.click();

    // Owner sees the buyer's message
    await expect(page.getByTestId("message-bubble").filter({ hasText: buyerMessage })).toBeVisible();

    // Owner replies
    const sellerReply = `E2E thanks ${Date.now()}`;
    await page.getByTestId("message-composer").fill(sellerReply);
    await page.getByTestId("message-send").click();
    await expect(page.getByTestId("message-bubble").filter({ hasText: sellerReply })).toBeVisible();

    // --- Buyer returns and sees the reply ---
    await page.context().clearCookies();
    await signIn(page, "member@shouks.test", "Test123!@#");
    await page.goto("/m/ferrari-frenzy/messages");
    await page.getByTestId("thread-row").first().click();
    await expect(page.getByTestId("message-bubble").filter({ hasText: sellerReply })).toBeVisible();
  });
});
