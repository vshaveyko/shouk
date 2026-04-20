import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { OwnerShell } from "@/components/owner/OwnerShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

// Ported from design Flow 7 screen 7A.
// TODO: wire real KPIs and chart data. Currently uses stubs + counts from DB.
const analyticsCss = `
.an-body { padding: 28px 32px; min-width: 0; }
.an-body .page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 22px; flex-wrap: wrap; }
.an-body .page-head h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 34px; line-height: 1.05; letter-spacing: -0.01em; }
.an-body .page-head .lead { font-size: 13px; color: var(--muted); margin-top: 6px; max-width: 560px; }

.an-body .range-picker { display: inline-flex; gap: 2px; background: var(--bg-soft); border: 1px solid var(--line); border-radius: 8px; padding: 3px; }
.an-body .range-picker button { padding: 6px 10px; border-radius: 5px; font-size: 12px; color: var(--muted); font-weight: 500; background: transparent; border: 0; cursor: pointer; }
.an-body .range-picker button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px oklch(0 0 0 / 0.06); }

.an-body .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
@media (max-width: 900px) { .an-body .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .an-body .kpi-grid { grid-template-columns: 1fr; } }
.an-body .kpi { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; position: relative; }
.an-body .kpi .k-label { font-size: 10.5px; color: var(--muted); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
.an-body .kpi .k-label svg { width: 12px; height: 12px; flex: none; }
.an-body .kpi .k-delta svg { width: 11px; height: 11px; flex: none; }
.an-body .kpi .k-num { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 36px; line-height: 1; margin-top: 10px; letter-spacing: -0.015em; }
.an-body .kpi .k-delta { font-size: 11.5px; color: var(--muted); margin-top: 7px; display: flex; align-items: center; gap: 5px; }
.an-body .kpi .k-delta.up { color: var(--success); }
.an-body .kpi .k-delta.down { color: var(--danger); }

.an-body .chart-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px; }
.an-body .panel { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.an-body .panel-hd { padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line-soft); }
.an-body .panel-hd h3 { font-size: 13.5px; font-weight: 600; letter-spacing: -0.005em; }
.an-body .chart-wrap { padding: 18px 22px 22px; min-height: 240px; display: grid; place-items: center; color: var(--muted); font-size: 13px; }

.an-body .top-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
@media (max-width: 900px) { .an-body .top-grid { grid-template-columns: 1fr; } }
.an-body .top-row { display: flex; align-items: center; gap: 12px; padding: 10px 18px; border-bottom: 1px solid var(--line-soft); }
.an-body .top-row:last-child { border-bottom: 0; }
.an-body .top-row .rank { font-family: ui-monospace, monospace; font-size: 11px; color: var(--muted); width: 14px; flex: none; }
.an-body .top-row .av { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 11px; font-weight: 600; flex: none; background: linear-gradient(135deg, oklch(0.65 0.12 30), oklch(0.35 0.09 30)); }
.an-body .top-row .tr-body { flex: 1; min-width: 0; }
.an-body .top-row .tr-t { font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.an-body .top-row .tr-s { font-size: 11px; color: var(--muted); margin-top: 2px; }
.an-body .top-row .tr-num { font-variant-numeric: tabular-nums; font-weight: 600; font-size: 13px; }
`;

export default async function AnalyticsPage({
  params,
}: {
  params: { slug: string };
}) {
  const { marketplace } = await requireOwnerOf(params.slug);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400 * 1000);

  const [
    members30d,
    membersPrev,
    listings30d,
    listingsPrev,
    soldTotal,
    activeTotal,
    topListings,
  ] = await Promise.all([
    prisma.membership.count({
      where: {
        marketplaceId: marketplace.id,
        joinedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.membership.count({
      where: {
        marketplaceId: marketplace.id,
        joinedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
    prisma.listing.count({
      where: {
        marketplaceId: marketplace.id,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.listing.count({
      where: {
        marketplaceId: marketplace.id,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
    prisma.listing.aggregate({
      _sum: { priceCents: true },
      _count: true,
      where: {
        marketplaceId: marketplace.id,
        status: "SOLD",
        soldAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.listing.count({
      where: { marketplaceId: marketplace.id, status: "ACTIVE" },
    }),
    prisma.listing.findMany({
      where: { marketplaceId: marketplace.id },
      orderBy: { views: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        priceCents: true,
        currency: true,
        views: true,
      },
    }),
  ]);

  const memberDelta = members30d - membersPrev;
  const listingDelta = listings30d - listingsPrev;
  const gmvCents = soldTotal._sum.priceCents ?? 0;

  function shortCurrency(cents: number) {
    const n = cents / 100;
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
    return `$${n.toLocaleString()}`;
  }

  return (
    <OwnerShell slug={params.slug}>
      <style dangerouslySetInnerHTML={{ __html: analyticsCss }} />
      <main className="an-body">
        <div className="page-head">
          <div>
            <h1>Analytics</h1>
            <div className="lead">
              How {marketplace.name} is performing. 30-day window by default.
            </div>
          </div>
          <div className="range-picker">
            <button>7d</button>
            <button className="on">30d</button>
            <button>90d</button>
            <button>All</button>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi">
            <div className="k-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              New members
            </div>
            <div className="k-num">{members30d}</div>
            <div className={memberDelta >= 0 ? "k-delta up" : "k-delta down"}>
              {memberDelta >= 0 ? "▲" : "▼"} {Math.abs(memberDelta)} vs prev 30d
            </div>
          </div>

          <div className="kpi">
            <div className="k-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
              </svg>
              Listings posted
            </div>
            <div className="k-num">{listings30d}</div>
            <div className={listingDelta >= 0 ? "k-delta up" : "k-delta down"}>
              {listingDelta >= 0 ? "▲" : "▼"} {Math.abs(listingDelta)} vs prev 30d
            </div>
          </div>

          <div className="kpi">
            <div className="k-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m7 14 4-4 4 4 5-5" />
              </svg>
              GMV (30d)
            </div>
            <div className="k-num">{shortCurrency(gmvCents)}</div>
            <div className="k-delta">
              {soldTotal._count} {soldTotal._count === 1 ? "sale" : "sales"} · {activeTotal} active listings
            </div>
          </div>
        </div>

        <div className="chart-grid">
          <div className="panel">
            <div className="panel-hd">
              <h3>Growth</h3>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                Members + listings over time
              </span>
            </div>
            <div className="chart-wrap">
              Chart coming soon — data collection in progress.
            </div>
          </div>
        </div>

        <div className="top-grid">
          <div className="panel">
            <div className="panel-hd">
              <h3>Top listings</h3>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>By views</span>
            </div>
            {topListings.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                No listings yet.
              </div>
            ) : (
              topListings.map((l, i) => (
                <div key={l.id} className="top-row">
                  <div className="rank">{i + 1}</div>
                  <div className="av" />
                  <div className="tr-body">
                    <div className="tr-t">{l.title}</div>
                    <div className="tr-s">
                      {l.priceCents != null
                        ? shortCurrency(l.priceCents)
                        : "—"}
                    </div>
                  </div>
                  <div className="tr-num">{l.views}</div>
                </div>
              ))
            )}
          </div>

          <div className="panel">
            <div className="panel-hd">
              <h3>Top sellers</h3>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>By GMV</span>
            </div>
            <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              No sales data yet.
            </div>
          </div>

          <div className="panel">
            <div className="panel-hd">
              <h3>Traffic sources</h3>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Coming soon</span>
            </div>
            <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              Referrer tracking not yet enabled.
            </div>
          </div>
        </div>
      </main>
    </OwnerShell>
  );
}
