import { requireOwnerOf } from "@/lib/auth-helpers";
import { OwnerShell } from "@/components/owner/OwnerShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payouts" };

// Stub for owner payouts. Not in any design flow directly; placeholder so sidebar
// link doesn't 404. TODO: wire Stripe Connect when monetization lands.
const payoutsCss = `
.pay-body { padding: 28px 32px; min-width: 0; }
.pay-body .page-head { margin-bottom: 22px; }
.pay-body .page-head h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 34px; line-height: 1.05; letter-spacing: -0.01em; }
.pay-body .page-head .lead { font-size: 13px; color: var(--muted); margin-top: 6px; max-width: 560px; }
.pay-body .empty-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 48px 24px; text-align: center; }
.pay-body .empty-card h3 { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 6px; }
.pay-body .empty-card p { font-size: 13px; color: var(--muted); max-width: 420px; margin: 0 auto 18px; }
.pay-body .cta { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 500; background: var(--ink); color: #fff; border: 0; cursor: pointer; }
`;

export default async function PayoutsPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireOwnerOf(params.slug);

  return (
    <OwnerShell slug={params.slug}>
      <style dangerouslySetInnerHTML={{ __html: payoutsCss }} />
      <main className="pay-body">
        <div className="page-head">
          <h1>Payouts</h1>
          <div className="lead">
            Where your membership revenue lands — plus any platform-facilitated fees.
          </div>
        </div>

        <div className="empty-card">
          <h3>No payout account connected yet.</h3>
          <p>
            Connect Stripe Connect to start collecting membership fees and receive
            payouts to your bank. Takes about 3 minutes.
          </p>
          <button type="button" className="cta" disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
            Connect Stripe (coming soon)
          </button>
        </div>
      </main>
    </OwnerShell>
  );
}
