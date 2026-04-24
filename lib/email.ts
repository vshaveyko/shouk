/**
 * Minimal transactional-email sender (SHK-044). V1 plumbing:
 *
 * - In production, posts to the Resend HTTP API when RESEND_API_KEY and
 *   EMAIL_FROM are configured. We intentionally don't take a hard
 *   dependency on the `resend` package so the build stays small and the
 *   codepath is easy to swap later for Postmark/SES/etc.
 * - In development (or any env with no provider key), logs the intended
 *   envelope + HTML length to the console so we can confirm call sites
 *   fire without accidentally sending real mail.
 * - Never throws; failures are logged but do not block the user-facing
 *   action that triggered the send.
 */
type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** Optional override; defaults to process.env.EMAIL_FROM. */
  from?: string;
};

/**
 * Addresses the seed/e2e users sit under. Sending to them would
 * hard-bounce from any real SMTP provider and count against the sender
 * reputation, so sendEmail short-circuits any recipient under `.test`
 * or `@shouks.test` with a dev-mode log instead of a real provider call.
 */
const TEST_RECIPIENT = /(@shouks\.test|\.test)$/i;

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: SendEmailInput): Promise<{ ok: boolean; id?: string; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = from ?? process.env.EMAIL_FROM ?? "Shouks <noreply@shouks.test>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[email:dev] → ${to} | ${subject} (${html.length} chars) — no RESEND_API_KEY, skipping send`,
      );
    }
    return { ok: false, reason: "no-provider" };
  }

  if (TEST_RECIPIENT.test(to)) {
    console.log(
      `[email:test] → ${to} | ${subject} (${html.length} chars) — test-domain recipient, skipping Resend`,
    );
    return { ok: false, reason: "test-recipient" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: sender, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] provider rejected send to ${to}: ${res.status} ${body}`);
      return { ok: false, reason: `provider-${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, reason: "network" };
  }
}
