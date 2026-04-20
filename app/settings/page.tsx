import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account settings" };

// Ported from design Flow 6 screen 6H. Left-rail settings nav + right panel.
// Profile edit is existing /profile; this page links sections out. TODO: inline tabs.
const settingsCss = `
.set-wrap { max-width: 1000px; margin: 0 auto; padding: 28px 24px 60px; }
.set-head { padding-bottom: 18px; border-bottom: 1px solid var(--line); margin-bottom: 22px; }
.set-head h1 { margin: 0; font-family: "Instrument Serif", serif; font-weight: 400; font-size: 34px; letter-spacing: -0.01em; }
.set-head .sub { font-size: 13px; color: var(--muted); margin-top: 4px; }
.set-layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 32px; }
@media (max-width: 820px) { .set-layout { grid-template-columns: 1fr; } }

.set-nav { display: flex; flex-direction: column; gap: 2px; position: sticky; top: 20px; align-self: start; }
.set-nav a { text-align: left; padding: 9px 12px; font-size: 13px; font-weight: 500; color: var(--ink-soft); border-radius: 8px; display: flex; align-items: center; gap: 10px; letter-spacing: -0.005em; text-decoration: none; }
.set-nav a:hover { background: var(--bg-soft); }
.set-nav a.active { background: var(--ink); color: #fff; }
.set-nav a svg { width: 14px; height: 14px; flex: none; }

.set-panel { min-width: 0; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 22px 24px; }
.set-section { margin-bottom: 24px; }
.set-section h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.set-section p { font-size: 12.5px; color: var(--muted); margin-bottom: 12px; }
.set-field { display: grid; grid-template-columns: 200px 1fr; gap: 16px; padding: 14px 0; border-top: 1px solid var(--line-soft); align-items: center; }
.set-field:first-of-type { border-top: 0; padding-top: 0; }
.set-field label { font-size: 13px; font-weight: 500; color: var(--ink); }
.set-field .val { font-size: 13px; color: var(--ink-soft); }
.set-field .linkout { font-size: 13px; color: var(--blue-ink); font-weight: 500; text-decoration: none; }
.set-field .linkout:hover { text-decoration: underline; }
`;

export default async function UserSettingsPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/settings");
  const { user, memberships, owned } = ctx;

  const unread = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  const verified = await prisma.verifiedAccount.findMany({
    where: { userId: user.id },
    select: { provider: true },
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-soft)" }}>
      <Navbar
        user={{
          id: user.id,
          name: user.displayName ?? user.name,
          image: user.image,
          email: user.email,
        }}
        activeMarketplace={null}
        marketplaces={[...owned, ...memberships]}
        mode="member"
        notificationCount={unread}
      />
      <style dangerouslySetInnerHTML={{ __html: settingsCss }} />

      <div className="set-wrap">
        <div className="set-head">
          <h1>Settings</h1>
          <div className="sub">
            Manage your account, identity, and how Shouks reaches you.
          </div>
        </div>

        <div className="set-layout">
          <nav className="set-nav" aria-label="Settings sections">
            <a href="#account" className="active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Account
            </a>
            <Link href="/profile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M15 8h3M15 12h3M6 17h12" />
              </svg>
              Public profile
            </Link>
            <Link href="/onboarding/verify">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 12 2 2 4-4" />
                <path d="M12 2l3 3 5-2-2 5 3 3-3 3 2 5-5-2-3 3-3-3-5 2 2-5-3-3 3-3-2-5 5 2 3-3z" />
              </svg>
              Identity &amp; trust
            </Link>
            <a href="#payments">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              Payments &amp; payouts
            </a>
            <a href="#notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              Notifications
            </a>
            <a href="#privacy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Privacy &amp; data
            </a>
          </nav>

          <div className="set-panel">
            <section className="set-section" id="account">
              <h3>Account</h3>
              <p>Basics we use to sign you in and contact you.</p>
              <div className="set-field">
                <label>Email</label>
                <span className="val">{user.email ?? "—"}</span>
              </div>
              <div className="set-field">
                <label>Display name</label>
                <span className="val">{user.displayName ?? user.name ?? "—"}</span>
              </div>
              <div className="set-field">
                <label>Member since</label>
                <span className="val">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </section>

            <section className="set-section" id="identity">
              <h3>Identity &amp; trust</h3>
              <p>
                Verified accounts signal to other members that you&apos;re real.
                Some marketplaces require specific providers to join.
              </p>
              <div className="set-field">
                <label>Verified accounts</label>
                <span className="val">
                  {verified.length} linked
                  <Link
                    href="/onboarding/verify"
                    className="linkout"
                    style={{ marginLeft: 10 }}
                  >
                    Manage →
                  </Link>
                </span>
              </div>
            </section>

            <section className="set-section" id="payments">
              <h3>Payments &amp; payouts</h3>
              <p>
                Shouks doesn&apos;t process payments between buyers and sellers —
                transactions happen off-platform. Membership billing (if any) lives
                per-marketplace in Owner → Billing.
              </p>
            </section>

            <section className="set-section" id="notifications">
              <h3>Notifications</h3>
              <p>Control what reaches your inbox, push, and WhatsApp.</p>
              <div className="set-field">
                <label>Notification preferences</label>
                <Link href="/notifications" className="linkout">
                  Open notification center →
                </Link>
              </div>
            </section>

            <section className="set-section" id="privacy">
              <h3>Privacy &amp; data</h3>
              <p>Export your data, or delete your account and all associated content.</p>
              <div className="set-field">
                <label>Data export</label>
                <span className="val">Coming soon</span>
              </div>
              <div className="set-field">
                <label>Delete account</label>
                <span className="val">Email support@shouks.com</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
