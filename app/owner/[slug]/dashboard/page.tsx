import Link from "next/link";
import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { Avatar } from "@/components/ui/Avatar";
import { formatCents, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const dashboardCss = `
.dash-body { padding: 28px 32px; min-width: 0; }
.dash-body .page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 22px; }
.dash-body .page-head h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 34px; line-height: 1.05; letter-spacing: -0.01em; }
.dash-body .page-head h1 em { font-style: italic; color: var(--blue-ink); }
.dash-body .page-head .lead { font-size: 13px; color: var(--muted); margin-top: 6px; max-width: 560px; }
.dash-body .page-head .ph-actions { display: flex; gap: 8px; flex-shrink: 0; }
.dash-body .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 500; border: 1px solid transparent; cursor: pointer; transition: all 120ms; }
.dash-body .btn-outline { background: #fff; color: var(--ink); border-color: var(--line); }
.dash-body .btn-outline:hover { background: var(--hover); }
.dash-body .btn-dark { background: var(--ink); color: #fff; }
.dash-body .btn-dark:hover { background: oklch(0.26 0.025 240); }
.dash-body .btn svg { width: 14px; height: 14px; stroke-width: 2; }

.dash-body .metric-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 22px; }
@media (max-width: 1100px) { .dash-body .metric-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 700px)  { .dash-body .metric-grid { grid-template-columns: repeat(2, 1fr); } }
.dash-body .metric { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; position: relative; cursor: pointer; transition: border-color 0.12s, transform 0.12s; display: block; color: inherit; text-decoration: none; }
.dash-body .metric:hover { border-color: oklch(0.8 0.02 230); transform: translateY(-1px); box-shadow: var(--shadow); }
.dash-body .metric .m-label { font-size: 11px; color: var(--muted); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
.dash-body .metric .m-label svg { width: 12px; height: 12px; }
.dash-body .metric .m-num { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 38px; line-height: 1; margin-top: 10px; letter-spacing: -0.015em; }
.dash-body .metric .m-delta { font-size: 11px; color: var(--muted); margin-top: 7px; }
.dash-body .metric .m-delta.up { color: var(--success); }
.dash-body .metric .m-delta.warn { color: oklch(0.48 0.15 50); }
.dash-body .metric.hot { border-color: oklch(0.8 0.08 25); background: var(--danger-soft); }
.dash-body .metric.hot .m-num { color: var(--danger); }
.dash-body .metric.hot .m-label { color: var(--danger); }
.dash-body .metric .m-arrow { position: absolute; top: 16px; right: 16px; color: var(--muted); }
.dash-body .metric .m-arrow svg { width: 13px; height: 13px; }

.dash-body .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 900px) { .dash-body .section-grid { grid-template-columns: 1fr; } }
.dash-body .panel { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.dash-body .panel-hd { padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line-soft); }
.dash-body .panel-hd h3 { font-size: 13.5px; font-weight: 600; letter-spacing: -0.005em; }
.dash-body .panel-hd .view-all { font-size: 12px; color: var(--blue-ink); font-weight: 500; white-space: nowrap; }
.dash-body .panel-hd .view-all:hover { text-decoration: underline; }

.dash-body .app-row { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--line-soft); cursor: pointer; transition: background 0.12s; color: inherit; text-decoration: none; }
.dash-body .app-row:last-child { border-bottom: 0; }
.dash-body .app-row:hover { background: var(--bg-soft); }
.dash-body .app-row .av-chip { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 13px; font-weight: 600; flex: none; }
.dash-body .app-row .ar-body { min-width: 0; flex: 1; }
.dash-body .app-row .ar-name { font-size: 13px; font-weight: 600; letter-spacing: -0.005em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dash-body .app-row .ar-meta { font-size: 11.5px; color: var(--muted); margin-top: 2px; display: flex; gap: 6px; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dash-body .app-row .ar-meta .dot { width: 2px; height: 2px; background: var(--muted); border-radius: 50%; }
.dash-body .app-row .ar-time { font-size: 11.5px; color: var(--muted); white-space: nowrap; }
.dash-body .app-row .ar-chevron { color: var(--muted); }
.dash-body .app-row .ar-chevron svg { width: 14px; height: 14px; }

.dash-body .feed-row { display: grid; grid-template-columns: 28px 1fr auto; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--line-soft); align-items: center; }
.dash-body .feed-row:last-child { border-bottom: 0; }
.dash-body .feed-row .fr-icon { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; flex: none; color: var(--ink-soft); }
.dash-body .feed-row .fr-icon svg { width: 12px; height: 12px; }
.dash-body .feed-row .fr-icon.ok { background: var(--success-soft); color: var(--success); }
.dash-body .feed-row .fr-icon.no { background: var(--danger-soft); color: var(--danger); }
.dash-body .feed-row .fr-icon.bid { background: var(--blue-softer); color: var(--blue-ink); }
.dash-body .feed-row .fr-icon.new { background: var(--warn-soft); color: oklch(0.48 0.15 65); }
.dash-body .feed-row .fr-text { font-size: 12.5px; color: var(--ink-soft); min-width: 0; }
.dash-body .feed-row .fr-text b { color: var(--ink); font-weight: 600; }
.dash-body .feed-row .fr-time { font-size: 11px; color: var(--muted); white-space: nowrap; }
.dash-body .empty { padding: 28px 18px; text-align: center; font-size: 12.5px; color: var(--muted); }
`;

const avatarGradients = [
  "linear-gradient(135deg, oklch(0.65 0.15 260), oklch(0.45 0.12 260))",
  "linear-gradient(135deg, oklch(0.62 0.16 30),  oklch(0.42 0.13 30))",
  "linear-gradient(135deg, oklch(0.55 0.14 155), oklch(0.35 0.10 155))",
  "linear-gradient(135deg, oklch(0.58 0.13 80),  oklch(0.38 0.10 80))",
  "linear-gradient(135deg, oklch(0.60 0.16 280), oklch(0.40 0.13 280))",
];

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export default async function OwnerDashboardPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const { marketplace, userId } = await requireOwnerOf(params.slug);
  const ownerUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, displayName: true },
  });
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400 * 1000);
  const fortyEightHrsAgo = new Date(Date.now() - 48 * 3600 * 1000);

  const [
    memberCount,
    pendingApps,
    pendingAppsAging,
    pendingListingsToApprove,
    pendingListingsEdited,
    activeMembersLast7d,
    gmv30d,
    gmvPrev30d,
    gmvSalesCount,
    activeListingsCount,
    recentApps,
    recentActivity,
  ] = await Promise.all([
    prisma.membership.count({
      where: { marketplaceId: marketplace.id, status: "ACTIVE" },
    }),
    prisma.application.count({
      where: { marketplaceId: marketplace.id, status: "PENDING" },
    }),
    prisma.application.count({
      where: {
        marketplaceId: marketplace.id,
        status: "PENDING",
        createdAt: { lte: fortyEightHrsAgo },
      },
    }),
    marketplace.moderationRequired
      ? prisma.listing.count({
          where: {
            marketplaceId: marketplace.id,
            status: "PENDING_REVIEW",
          },
        })
      : Promise.resolve(0),
    marketplace.moderationRequired
      ? prisma.listing.count({
          where: {
            marketplaceId: marketplace.id,
            status: "PENDING_REVIEW",
            editedAt: { not: null },
          },
        })
      : Promise.resolve(0),
    prisma.membership.count({
      where: {
        marketplaceId: marketplace.id,
        status: "ACTIVE",
        joinedAt: { gte: new Date(Date.now() - 7 * 86400 * 1000) },
      },
    }),
    prisma.listing.aggregate({
      _sum: { priceCents: true },
      where: {
        marketplaceId: marketplace.id,
        status: "SOLD",
        soldAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.listing.aggregate({
      _sum: { priceCents: true },
      where: {
        marketplaceId: marketplace.id,
        status: "SOLD",
        soldAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
    prisma.listing.count({
      where: {
        marketplaceId: marketplace.id,
        status: "SOLD",
        soldAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.listing.count({
      where: { marketplaceId: marketplace.id, status: "ACTIVE" },
    }),
    prisma.application.findMany({
      where: { marketplaceId: marketplace.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            name: true,
            image: true,
            email: true,
            verifiedAccounts: { select: { provider: true } },
          },
        },
      },
    }),
    // activity feed: union of applications (updated), listings (created), bids
    (async () => {
      const [recentApproved, newListings, recentApps2, soldListings, recentBids] =
        await Promise.all([
          prisma.application.findMany({
            where: {
              marketplaceId: marketplace.id,
              status: { in: ["APPROVED", "REJECTED"] },
            },
            orderBy: { reviewedAt: "desc" },
            take: 5,
            include: {
              user: { select: { displayName: true, name: true } },
            },
          }),
          prisma.listing.findMany({
            where: { marketplaceId: marketplace.id },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
              priceCents: true,
              currency: true,
              soldAt: true,
            },
          }),
          prisma.application.findMany({
            where: { marketplaceId: marketplace.id, status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 3,
            include: { user: { select: { displayName: true, name: true } } },
          }),
          prisma.listing.findMany({
            where: { marketplaceId: marketplace.id, status: "SOLD" },
            orderBy: { soldAt: "desc" },
            take: 3,
            select: {
              id: true,
              title: true,
              priceCents: true,
              currency: true,
              soldAt: true,
            },
          }),
          prisma.bid.findMany({
            where: { listing: { marketplaceId: marketplace.id } },
            orderBy: { createdAt: "desc" },
            take: 3,
            include: {
              listing: { select: { title: true, currency: true } },
              user: { select: { displayName: true, name: true } },
            },
          }),
        ]);
      type Feed = {
        when: Date;
        kind: "ok" | "no" | "bid" | "new";
        text: React.ReactNode;
      };
      const feed: Feed[] = [];
      for (const a of recentApproved) {
        if (!a.reviewedAt) continue;
        const nm = a.user.displayName ?? a.user.name ?? "Applicant";
        feed.push(
          a.status === "APPROVED"
            ? { when: a.reviewedAt, kind: "ok", text: <><b>{nm}</b> approved · auto-notified by email</> }
            : { when: a.reviewedAt, kind: "no", text: <><b>{nm}</b> rejected</> },
        );
      }
      for (const l of newListings) {
        if (l.status === "PENDING_REVIEW") {
          feed.push({
            when: l.createdAt,
            kind: "bid",
            text: <>New listing <b>{l.title}</b> needs approval</>,
          });
        } else if (l.status === "ACTIVE") {
          feed.push({
            when: l.createdAt,
            kind: "new",
            text: <>Listing <b>{l.title}</b> published</>,
          });
        }
      }
      for (const a of recentApps2) {
        const nm = a.user.displayName ?? a.user.name ?? "Applicant";
        feed.push({
          when: a.createdAt,
          kind: "new",
          text: <><b>{nm}</b> applied for membership</>,
        });
      }
      for (const s of soldListings) {
        if (!s.soldAt) continue;
        feed.push({
          when: s.soldAt,
          kind: "ok",
          text: <>Listing <b>{s.title}</b> sold — {formatCents(s.priceCents ?? 0, s.currency ?? "USD")}</>,
        });
      }
      for (const b of recentBids) {
        const bidder = b.user.displayName ?? b.user.name ?? "Bidder";
        feed.push({
          when: b.createdAt,
          kind: "bid",
          text: <><b>{bidder}</b> bid {formatCents(b.amountCents, b.listing.currency ?? "USD")} on <b>{b.listing.title}</b></>,
        });
      }
      feed.sort((a, z) => z.when.getTime() - a.when.getTime());
      return feed.slice(0, 6);
    })(),
  ]);

  const gmvCents = gmv30d._sum.priceCents ?? 0;
  const gmvPrevCents = gmvPrev30d._sum.priceCents ?? 0;
  const gmvDeltaCents = gmvCents - gmvPrevCents;

  const displayOwner =
    ownerUser?.displayName ?? ownerUser?.name?.split(" ")[0] ?? "there";
  const totalListingsToApprove = pendingListingsToApprove;
  const pendingListingsNew = Math.max(0, totalListingsToApprove - pendingListingsEdited);

  return (
    <OwnerShell slug={params.slug}>
      <style dangerouslySetInnerHTML={{ __html: dashboardCss }} />
      <main className="dash-body">
        <div className="page-head">
          <div>
            <h2 className="text-[11px] tracking-[0.14em] uppercase text-blue-ink font-semibold mb-2">
              {marketplace.name}
            </h2>
            <h1>
              Welcome back, <em>{displayOwner}</em>.
            </h1>
            <div className="lead">
              {pendingApps + totalListingsToApprove > 0 ? (
                <>
                  You have{" "}
                  <b style={{ color: "var(--ink)" }}>{pendingApps} applications</b>
                  {" "}and{" "}
                  <b style={{ color: "var(--ink)" }}>{totalListingsToApprove} listings</b>
                  {" "}waiting for review. Most owners handle their queue once or twice a day.
                </>
              ) : (
                <>Queue is clear. Check analytics when you have a moment.</>
              )}
            </div>
          </div>
          <div className="ph-actions">
            <Link href={`/owner/${marketplace.slug}/applications`} className="btn btn-dark">
              Review queue
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="metric-grid">
          <Link
            href={`/owner/${marketplace.slug}/applications`}
            className={`metric ${pendingApps > 0 && pendingAppsAging > 0 ? "hot" : ""}`}
          >
            <div className="m-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Pending applications
            </div>
            <div className="m-num">{pendingApps}</div>
            {pendingAppsAging > 0 ? (
              <div className="m-delta warn">{pendingAppsAging} waiting over 48h</div>
            ) : (
              <div className="m-delta">All handled within 48h</div>
            )}
            <span className="m-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          <Link href={`/owner/${marketplace.slug}/listings`} className="metric">
            <div className="m-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
              </svg>
              Listings to approve
            </div>
            <div className="m-num">{totalListingsToApprove}</div>
            <div className="m-delta">
              {pendingListingsNew} new · {pendingListingsEdited} edited
            </div>
            <span className="m-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          <Link href={`/owner/${marketplace.slug}/members`} className="metric">
            <div className="m-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Active members
            </div>
            <div className="m-num">{memberCount}</div>
            {activeMembersLast7d > 0 ? (
              <div className="m-delta up">+{activeMembersLast7d} this week</div>
            ) : (
              <div className="m-delta">No new members this week</div>
            )}
          </Link>

          <div className="metric">
            <div className="m-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m7 14 4-4 4 4 5-5" />
              </svg>
              Gross market value (30d)
            </div>
            <div className="m-num">{formatShortCurrency(gmvCents)}</div>
            <div className={gmvDeltaCents >= 0 ? "m-delta up" : "m-delta"}>
              {gmvSalesCount} {gmvSalesCount === 1 ? "sale" : "sales"}
              {gmvPrevCents > 0
                ? ` · ${gmvDeltaCents >= 0 ? "+" : ""}${formatShortCurrency(gmvDeltaCents)} vs prev`
                : ""}
            </div>
          </div>

          <Link href={`/owner/${marketplace.slug}/listings`} className="metric">
            <div className="m-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h10M4 18h16" />
              </svg>
              Active listings
            </div>
            <div className="m-num">{activeListingsCount}</div>
            <div className="m-delta">Currently published</div>
          </Link>
        </div>

        <div className="section-grid">
          <div className="panel">
            <div className="panel-hd">
              <h3>Latest applications</h3>
              <Link
                href={`/owner/${marketplace.slug}/applications`}
                className="view-all"
              >
                View all {pendingApps} →
              </Link>
            </div>
            <div>
              {recentApps.length === 0 ? (
                <div className="empty">Queue is clear.</div>
              ) : (
                recentApps.map((a, i) => {
                  const nm = a.user.displayName ?? a.user.name ?? a.user.email;
                  const gradient = avatarGradients[i % avatarGradients.length];
                  const verified = a.user.verifiedAccounts?.length ?? 0;
                  return (
                    <Link
                      key={a.id}
                      href={`/owner/${marketplace.slug}/applications/${a.id}`}
                      className="app-row"
                    >
                      {a.user.image ? (
                        <Avatar src={a.user.image} name={nm} size={36} />
                      ) : (
                        <div className="av-chip" style={{ background: gradient }}>
                          {initials(nm)}
                        </div>
                      )}
                      <div className="ar-body">
                        <div className="ar-name">{nm}</div>
                        <div className="ar-meta">
                          <span>Applicant</span>
                          <span className="dot"></span>
                          <span>{verified} verified account{verified === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                      <div className="ar-time">{timeAgo(a.createdAt)}</div>
                      <span className="ar-chevron">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-hd">
              <h3>Recent activity</h3>
              <Link href={`/owner/${marketplace.slug}/listings`} className="view-all">
                Full history →
              </Link>
            </div>
            <div>
              {recentActivity.length === 0 ? (
                <div className="empty">Activity will show up here.</div>
              ) : (
                recentActivity.map((row, i) => (
                  <div key={i} className="feed-row">
                    <div className={`fr-icon ${row.kind}`}>
                      {row.kind === "ok" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                      {row.kind === "no" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      )}
                      {row.kind === "bid" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                          <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
                        </svg>
                      )}
                      {row.kind === "new" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M19 8v6M22 11h-6" />
                        </svg>
                      )}
                    </div>
                    <div className="fr-text">{row.text}</div>
                    <div className="fr-time">{timeAgo(row.when)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </OwnerShell>
  );
}

function formatShortCurrency(cents: number): string {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (Math.abs(dollars) >= 1_000) {
    return `$${Math.round(dollars / 1_000)}K`;
  }
  return `$${dollars.toLocaleString()}`;
}
