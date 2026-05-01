import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activity" };

// Ported from design Flow 6 screen 6G.
// TODO: wire live data — counts, saved listings, bids, alerts, ISO matches.
const activityCss = `
.act-wrap { max-width: 1200px; margin: 0 auto; padding: 28px 24px 60px; }
.act-head { padding-bottom: 18px; border-bottom: 1px solid var(--line); margin-bottom: 20px; }
.act-head h1 { margin: 0; font-family: "Instrument Serif", serif; font-weight: 400; font-size: 34px; letter-spacing: -0.01em; }
.act-head .sub { font-size: 13px; color: var(--muted); margin-top: 4px; }
.act-layout { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 28px; }
@media (max-width: 820px) { .act-layout { grid-template-columns: 1fr; } }

.act-nav { display: flex; flex-direction: column; gap: 2px; position: sticky; top: 20px; align-self: start; }
.act-nav button { text-align: left; padding: 9px 12px; font-size: 13px; font-weight: 500; color: var(--ink-soft); border-radius: 8px; display: flex; align-items: center; gap: 10px; letter-spacing: -0.005em; background: transparent; border: 0; cursor: pointer; width: 100%; }
.act-nav button:hover { background: var(--bg-soft); }
.act-nav button.active { background: var(--ink); color: #fff; }
.act-nav button svg { width: 14px; height: 14px; flex: none; }
.act-nav button .ct { margin-left: auto; font-size: 11px; font-weight: 600; background: rgba(0,0,0,0.06); padding: 1px 7px; border-radius: 10px; color: inherit; }
.act-nav button.active .ct { background: rgba(255,255,255,0.18); color: #fff; }
.act-nav .act-label { font-size: 10px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; padding: 10px 12px 4px; font-weight: 600; }
.act-nav .live-dot { width: 7px; height: 7px; border-radius: 50%; background: oklch(0.55 0.15 60); margin-left: auto; box-shadow: 0 0 0 3px oklch(0.55 0.15 60 / 0.2); }

.act-panel { min-width: 0; }
.act-toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.act-toolbar .chip-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 11px; border-radius: 8px; font-size: 12px; background: #fff; border: 1px solid var(--line); color: var(--ink-soft); font-weight: 500; cursor: pointer; }
.act-toolbar .chip-btn.on { background: var(--ink); color: #fff; border-color: var(--ink); }
.act-toolbar .spacer { flex: 1; }

.bids-table { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.bids-head, .bids-row { display: grid; grid-template-columns: minmax(0, 1.8fr) 110px 110px 110px 130px 100px; gap: 14px; padding: 13px 16px; align-items: center; }
.bids-head { background: var(--bg-soft); font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
.bids-row { font-size: 13px; border-top: 1px solid var(--line-soft); cursor: pointer; }
.bids-row:hover { background: var(--bg-soft); }
.bids-row .item { display: flex; gap: 12px; align-items: center; min-width: 0; }
.bids-row .th { width: 44px; height: 44px; border-radius: 8px; flex: none; background: linear-gradient(135deg, oklch(0.5 0.18 25), oklch(0.25 0.08 25)); }
.bids-row .th.iso-thumb { background: linear-gradient(135deg, oklch(0.94 0.04 85), oklch(0.85 0.1 75)); display: grid; place-items: center; color: oklch(0.45 0.12 65); }
.bids-row .t { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bids-row .s { font-size: 11px; color: var(--muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bids-row .countdown { font-family: ui-monospace, monospace; font-weight: 600; letter-spacing: -0.01em; }
.bids-row .countdown.soon { color: oklch(0.5 0.15 25); }
.bids-row .price { font-weight: 600; }
.bids-row .act { color: var(--blue-ink); font-weight: 500; font-size: 12px; }

.bid-state { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 5px; }
.bid-state.leading { background: oklch(0.95 0.04 150); color: oklch(0.35 0.12 150); }
.bid-state.outbid { background: oklch(0.95 0.04 25); color: oklch(0.45 0.14 25); }
.bid-state.watching { background: var(--bg-soft); color: var(--muted); }
.bid-state.iso-match { background: oklch(0.95 0.05 75); color: oklch(0.4 0.12 65); }
.bid-state.iso-active { background: oklch(0.55 0.15 60); color: #fff; }
`;

export default async function ActivityPage(props: { searchParams?: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/activity");
  const { user, memberships, owned } = ctx;
  const initialTab = searchParams?.tab ?? "bids";

  const unread = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
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
      <style dangerouslySetInnerHTML={{ __html: activityCss }} />

      <div className="act-wrap">
        <div className="act-head">
          <h1>Activity</h1>
          <div className="sub">Private — only visible to you.</div>
        </div>

        <div className="act-layout">
          <nav className="act-nav" aria-label="Activity sections">
            <button type="button" className={initialTab === "saved" ? "active" : ""} data-act="saved">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              Saved
              <span className="ct">0</span>
            </button>
            <button type="button" className={initialTab === "bids" ? "active" : ""} data-act="bids">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Bids &amp; offers
              <span className="ct">0</span>
            </button>
            <button type="button" className={initialTab === "alerts" ? "active" : ""} data-act="alerts">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
                <path d="M11 7v4M11 14h.01" />
              </svg>
              Alerts
              <span className="ct">0</span>
            </button>
            <button type="button" data-act="notifs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              Notifications
              <span className="ct">{unread}</span>
            </button>

            <div className="act-label">Wanted / ISO</div>
            <button type="button" data-act="iso-mine">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              My wanted ads
              <span className="ct">0</span>
            </button>
            <button type="button" data-act="iso-matches">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Match alerts
            </button>

            <div className="act-label">Selling</div>
            <button type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
              </svg>
              All my listings
              <span className="ct">0</span>
            </button>
            <button type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M17 8 12 3 7 8" />
                <path d="M12 3v12" />
              </svg>
              Offers received
              <span className="ct">0</span>
            </button>
            <button type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
              Sold history
            </button>
          </nav>

          <div className="act-panel">
            <div className="act-toolbar">
              <button className="chip-btn on">All bids</button>
              <button className="chip-btn">Leading</button>
              <button className="chip-btn">Outbid</button>
              <button className="chip-btn">Watching</button>
              <div className="spacer" />
              <button className="chip-btn">All marketplaces</button>
            </div>

            <div className="bids-table">
              <div className="bids-head">
                <div>Listing</div>
                <div>Your bid</div>
                <div>Current</div>
                <div>Status</div>
                <div>Ends in</div>
                <div></div>
              </div>
              <div className="bids-row">
                <div className="item">
                  <div className="th" />
                  <div style={{ minWidth: 0 }}>
                    <div className="t">
                      Your activity will show up here once you start bidding.
                    </div>
                    <div className="s">
                      Ferrari Frenzy · Heritage Denim · more
                    </div>
                  </div>
                </div>
                <div className="price">—</div>
                <div className="price">—</div>
                <div>
                  <span className="bid-state watching">● Watching</span>
                </div>
                <div className="countdown">—</div>
                <div className="act">View →</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
