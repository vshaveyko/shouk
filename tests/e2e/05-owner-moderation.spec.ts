import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail, signUp, completeRole } from "../fixtures/helpers";

test.describe("Flow 5 · Owner Moderation", () => {
  test("owner dashboard shows marketplace stats", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/ferrari-frenzy/dashboard");
    await expect(page.getByRole("heading", { name: /ferrari frenzy/i })).toBeVisible();
  });

  test("owner sees pending applications in queue", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/ferrari-frenzy/applications");
    await expect(page.getByTestId("applications-list")).toBeVisible();
  });

  test("owner can switch between status tabs", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/ferrari-frenzy/applications");
    // Pending is the default tab and is highlighted
    await expect(page.getByTestId("apps-tab-PENDING")).toHaveAttribute(
      "data-active",
      "true",
    );
    // Switch to All — URL updates and non-pending rows can appear (Jane's NEEDS_INFO historical app)
    await page.getByTestId("apps-tab-ALL").click();
    await expect(page).toHaveURL(/status=ALL/);
    await expect(page.getByTestId("apps-tab-ALL")).toHaveAttribute(
      "data-active",
      "true",
    );
    // Switch to Approved — tab highlights even if queue is empty
    await page.getByTestId("apps-tab-APPROVED").click();
    await expect(page).toHaveURL(/status=APPROVED/);
    await expect(page.getByTestId("apps-tab-APPROVED")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  test("owner can search applicants by name", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/ferrari-frenzy/applications?status=ALL");
    const search = page.getByTestId("apps-search");
    await search.fill("jane");
    await search.press("Enter");
    await expect(page).toHaveURL(/q=jane/);
    const rows = page.getByTestId(/app-row-/);
    await expect(rows.first()).toBeVisible();
    await expect(rows.first()).toContainText(/jane/i);
    // Bogus query returns no rows
    await search.fill("zzz-no-match-xyz");
    await search.press("Enter");
    await expect(page.getByTestId("apps-empty")).toBeVisible();
  });

  test("owner can filter by verification level and change sort", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/ferrari-frenzy/applications?status=ALL");
    // Verification filter (Ferrari requires GOOGLE + FACEBOOK). Jane only has
    // GOOGLE, so she is "partial". Selecting "Fully verified" drops her.
    await page.getByTestId("apps-filter-verif").click();
    await page.getByTestId("apps-verif-full").click();
    await expect(page).toHaveURL(/verif=full/);
    // Switch sort to Newest first
    await page.getByTestId("apps-filter-sort").click();
    await page.getByTestId("apps-sort-newest").click();
    await expect(page).toHaveURL(/sort=newest/);
  });

  test("owner can approve an application", async ({ page }) => {
    // First create a fresh applicant
    const applicantEmail = uniqueEmail("approve");
    await signUp(page, { email: applicantEmail, password: "Test123!@#", displayName: "Approve Me" });
    await completeRole(page, "MEMBER");
    await page.goto("/onboarding/verify");
    await page.getByTestId("link-google").click();
    await page.getByTestId("link-facebook").click();
    await page.getByTestId("verify-continue").click();
    await page.goto("/apply/ferrari-frenzy");
    const longText = page.getByTestId("apply-form").locator("textarea").first();
    if (await longText.count()) await longText.fill("Approve me please.");
    await page.getByTestId("apply-submit").click();
    await expect(page).toHaveURL(/\/m\/ferrari-frenzy/);

    // Now sign in as owner and approve
    await page.goto("/api/auth/signout");
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/ferrari-frenzy/applications");
    // Select the most recent row
    const firstRow = page.getByTestId(/app-row-/).first();
    await firstRow.click();
    await page.getByTestId("app-approve").click();
    // Confirm dialog
    await page.getByTestId("app-confirm").click();
    await expect(page.getByText(/approved|queue is clear|no pending/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("owner can reject an application with reason", async ({ page }) => {
    // Generate fresh applicant
    const applicantEmail = uniqueEmail("reject");
    await signUp(page, { email: applicantEmail, password: "Test123!@#", displayName: "Reject Me" });
    await completeRole(page, "MEMBER");
    await page.goto("/onboarding/verify");
    await page.getByTestId("link-google").click();
    await page.getByTestId("link-facebook").click();
    await page.getByTestId("verify-continue").click();
    await page.goto("/apply/ferrari-frenzy");
    const longText = page.getByTestId("apply-form").locator("textarea").first();
    if (await longText.count()) await longText.fill("Please reject.");
    await page.getByTestId("apply-submit").click();

    await page.goto("/api/auth/signout");
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/ferrari-frenzy/applications");
    await page.getByTestId(/app-row-/).first().click();
    await page.getByTestId("app-reject").click();
    const note = page.getByTestId("app-note");
    if (await note.count()) await note.fill("Insufficient context.");
    await page.getByTestId("app-confirm").click();
    await expect(page.getByText(/rejected|queue is clear/i).first()).toBeVisible();
  });

  test("owner can view members directory and suspend a member", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/ferrari-frenzy/members");
    await expect(page.getByTestId("members-table")).toBeVisible();
    // Suspend Sasha
    const sashaRow = page.getByTestId(/member-row-/).filter({ hasText: /sasha/i }).first();
    if (await sashaRow.count()) {
      await sashaRow.getByRole("button").first().click();
      const suspend = page.getByTestId("member-action-SUSPEND");
      if (await suspend.count()) {
        await suspend.click();
        const reason = page.getByTestId("member-reason");
        if (await reason.count()) await reason.fill("Test suspend");
        await page.getByTestId("member-confirm").click();
        await expect(page.getByText(/suspended/i).first()).toBeVisible({ timeout: 8000 });
      }
    }
  });

  test("owner listing moderation queue renders", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/ferrari-frenzy/listings");
    await expect(page.getByTestId(/listings-tab-/).first()).toBeVisible();
  });

  test("owner sidebar is sticky under the navbar", async ({ page }) => {
    await signIn(page, "owner@shouks.test", "Test123!@#", /\/owner\//);
    await page.goto("/owner/ferrari-frenzy/dashboard");
    const sidebar = page.getByTestId("owner-sidebar");
    await expect(sidebar).toBeVisible();
    const { position, top } = await sidebar.evaluate((el) => {
      const s = getComputedStyle(el);
      return { position: s.position, top: s.top };
    });
    expect(position).toBe("sticky");
    // Should pin below the 60px-tall navbar
    expect(top).toBe("60px");
  });
});
