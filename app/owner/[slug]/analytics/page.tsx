import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { OwnerShell } from "@/components/owner/OwnerShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

// Ported from design Flow 7 screen 7A — KPIs, sparklines, growth chart, top lists.
const analyticsCss = `
.an-body { padding: 28px 32px; min-width: 0; }
.an-body .page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 22px; flex-wrap: wrap; }
.an-body .page-head h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 34px; line-height: 1.05; letter-spacing: -0.01em; }
.an-body .page-head h1 em { font-style: italic; }
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
.an-body .kpi .k-spark { margin-top: 10px; height: 28px; }
.an-body .kpi .k-spark svg { width: 100%; height: 100%; display: block; }

.an-body .chart-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px; }
.an-body .panel { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.an-body .panel-hd { padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line-soft); gap: 12px; flex-wrap: wrap; }
.an-body .panel-hd h3 { font-size: 13.5px; font-weight: 600; letter-spacing: -0.005em; }
.an-body .chart-wrap { padding: 18px 22px 22px; }
.an-body .chart-legend { display: flex; gap: 14px; font-size: 11.5px; color: var(--muted); }
.an-body .chart-legend .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; vertical-align: middle; }
.an-body .chart-svg { width: 100%; height: 220px; display: block; margin-top: 12px; }
.an-body .chart-svg .gridline { stroke: var(--line-soft); stroke-dasharray: 2 3; }
.an-body .chart-svg .axis-lbl { font-size: 10px; fill: var(--muted); font-family: ui-monospace, monospace; }

.an-body .top-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; }
@media (max-width: 900px) { .an-body .top-grid { grid-template-columns: 1fr; } }
.an-body .top-col { padding: 4px 0 10px; }
.an-body .top-col + .top-col { border-left: 1px solid var(--line-soft); }
@media (max-width: 900px) { .an-body .top-col + .top-col { border-left: 0; border-top: 1px solid var(--line-soft); } }
.an-body .top-col .col-hd { padding: 14px 18px 8px; font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
.an-body .top-row { display: flex; align-items: center; gap: 12px; padding: 10px 18px; border-bottom: 1px solid var(--line-soft); }
.an-body .top-row:last-child { border-bottom: 0; }
.an-body .top-row .rank { font-family: ui-monospace, monospace; font-size: 11px; color: var(--muted); width: 14px; flex: none; }
.an-body .top-row .av { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 11px; font-weight: 600; flex: none; background: linear-gradient(135deg, oklch(0.65 0.15 260), oklch(0.45 0.12 260)); }
.an-body .top-row .av.sq { border-radius: 6px; background: linear-gradient(135deg, oklch(0.65 0.12 30), oklch(0.35 0.09 30)); }
.an-body .top-row .tr-body { flex: 1; min-width: 0; }
.an-body .top-row .tr-name { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.an-body .top-row .tr-meta { font-size: 11px; color: var(--muted); margin-top: 1px; }
.an-body .top-row .tr-val { font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.an-body .empty { padding: 24px; text-align: center; color: var(--muted); font-size: 13px; }
`;

type DayBucket = { day: number; members: number; listings: number };

function initials(name: string | null | undefined, fallback: string) {
  const src = (name ?? fallback ?? "").trim();
  if (!src) return "??";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarGradient(seed: string) {
  // Deterministic hue so avatars keep stable colours across renders.
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(135deg, oklch(0.65 0.15 ${hue}), oklch(0.45 0.12 ${hue}))`;
}

function shortCurrency(cents: number) {
  const n = cents / 100;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

// Build a smooth polyline path scaled into the chart box. Data points are
// evenly spaced on x, values clamped to [0, yMax]. `closeToBaseline` creates
// the area-fill path that drops back to the x-axis.
function linePath(
  values: number[],
  {
    x0,
    x1,
    y0,
    y1,
    yMax,
    closeToBaseline = false,
  }: { x0: number; x1: number; y0: number; y1: number; yMax: number; closeToBaseline?: boolean },
) {
  if (values.length === 0) return "";
  const xSpan = x1 - x0;
  const ySpan = y1 - y0;
  const safeMax = Math.max(1, yMax);
  const step = values.length === 1 ? 0 : xSpan / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = x0 + i * step;
    const y = y1 - (Math.min(v, safeMax) / safeMax) * ySpan;
    return [x, y] as const;
  });
  const parts = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  let d = parts.join(" ");
  if (closeToBaseline) {
    d += ` L ${pts[pts.length - 1][0].toFixed(1)} ${y1} L ${pts[0][0].toFixed(1)} ${y1} Z`;
  }
  return d;
}

export default async function AnalyticsPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const { marketplace } = await requireOwnerOf(params.slug);
  const now = new Date();
  const WINDOW_DAYS = 30;
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 86400 * 1000);
  const prevStart = new Date(now.getTime() - 2 * WINDOW_DAYS * 86400 * 1000);

  const [
    membershipsWindow,
    listingsWindow,
    membershipsPrev,
    listingsPrev,
    activeTotal,
    memberTotal,
    soldAgg,
    soldPrevAgg,
    topListings,
    topSellersRaw,
  ] = await Promise.all([
    prisma.membership.findMany({
      where: { marketplaceId: marketplace.id, joinedAt: { gte: windowStart } },
      select: { joinedAt: true },
    }),
    prisma.listing.findMany({
      where: { marketplaceId: marketplace.id, createdAt: { gte: windowStart } },
      select: { createdAt: true, priceCents: true, status: true, soldAt: true },
    }),
    prisma.membership.count({
      where: {
        marketplaceId: marketplace.id,
        joinedAt: { gte: prevStart, lt: windowStart },
      },
    }),
    prisma.listing.count({
      where: {
        marketplaceId: marketplace.id,
        createdAt: { gte: prevStart, lt: windowStart },
      },
    }),
    prisma.listing.count({
      where: { marketplaceId: marketplace.id, status: "ACTIVE" },
    }),
    prisma.membership.count({
      where: { marketplaceId: marketplace.id, status: "ACTIVE" },
    }),
    prisma.listing.aggregate({
      _sum: { priceCents: true },
      _count: true,
      where: {
        marketplaceId: marketplace.id,
        status: "SOLD",
        soldAt: { gte: windowStart },
      },
    }),
    prisma.listing.aggregate({
      _sum: { priceCents: true },
      where: {
        marketplaceId: marketplace.id,
        status: "SOLD",
        soldAt: { gte: prevStart, lt: windowStart },
      },
    }),
    prisma.listing.findMany({
      where: { marketplaceId: marketplace.id, status: { in: ["ACTIVE", "SOLD"] } },
      orderBy: { views: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        views: true,
        priceCents: true,
        seller: { select: { displayName: true, name: true } },
      },
    }),
    prisma.listing.groupBy({
      by: ["sellerId"],
      where: {
        marketplaceId: marketplace.id,
        status: "SOLD",
        soldAt: { gte: windowStart },
      },
      _sum: { priceCents: true },
      _count: { _all: true },
      orderBy: { _sum: { priceCents: "desc" } },
      take: 5,
    }),
  ]);

  const sellerIds = topSellersRaw.map((r) => r.sellerId);
  const sellerInfo = sellerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, displayName: true, name: true },
      })
    : [];
  const activeBySeller = sellerIds.length
    ? await prisma.listing.groupBy({
        by: ["sellerId"],
        where: {
          marketplaceId: marketplace.id,
          sellerId: { in: sellerIds },
          status: "ACTIVE",
        },
        _count: { _all: true },
      })
    : [];

  // Build per-day buckets for the last 30 days, including days with no rows.
  const buckets: DayBucket[] = Array.from({ length: WINDOW_DAYS }, (_, i) => ({
    day: i,
    members: 0,
    listings: 0,
  }));
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  function dayIndex(d: Date) {
    const eventStart = new Date(d);
    eventStart.setHours(0, 0, 0, 0);
    const diff = Math.floor((todayStart.getTime() - eventStart.getTime()) / 86400000);
    return WINDOW_DAYS - 1 - diff;
  }
  for (const m of membershipsWindow) {
    const i = dayIndex(m.joinedAt);
    if (i >= 0 && i < WINDOW_DAYS) buckets[i].members += 1;
  }
  for (const l of listingsWindow) {
    const i = dayIndex(l.createdAt);
    if (i >= 0 && i < WINDOW_DAYS) buckets[i].listings += 1;
  }

  const newMembers = membershipsWindow.length;
  const newListings = listingsWindow.length;
  const memberDelta = newMembers - membershipsPrev;
  const listingDelta = newListings - listingsPrev;
  const memberPct =
    membershipsPrev > 0 ? Math.round((memberDelta / membershipsPrev) * 100) : null;
  const listingPct =
    listingsPrev > 0 ? Math.round((listingDelta / listingsPrev) * 100) : null;
  const gmvCents = soldAgg._sum.priceCents ?? 0;
  const gmvPrevCents = soldPrevAgg._sum.priceCents ?? 0;
  const gmvDelta = gmvCents - gmvPrevCents;
  const gmvPct =
    gmvPrevCents > 0 ? Math.round((gmvDelta / gmvPrevCents) * 100) : null;

  // Running sold-GMV sparkline for the GMV KPI (daily sold amount).
  const soldByDay = Array.from({ length: WINDOW_DAYS }, () => 0);
  for (const l of listingsWindow) {
    if (l.status === "SOLD" && l.soldAt && l.priceCents) {
      const i = dayIndex(l.soldAt);
      if (i >= 0 && i < WINDOW_DAYS) soldByDay[i] += l.priceCents;
    }
  }

  const memberSeries = buckets.map((b) => b.members);
  const listingSeries = buckets.map((b) => b.listings);

  // Main growth chart geometry matches design: viewBox 0 0 600 220,
  // plot area x: 40→600, y: 40→190. 4 gridlines at y = 40, 90, 140, 190.
  const chartMax = Math.max(4, ...memberSeries, ...listingSeries);
  const gridStep = Math.ceil(chartMax / 4);
  const yMaxRounded = gridStep * 4;

  const activeCountBySeller = new Map(
    activeBySeller.map((r) => [r.sellerId, r._count._all]),
  );
  const sellerById = new Map(sellerInfo.map((s) => [s.id, s]));
  const topSellers = topSellersRaw.map((r) => {
    const u = sellerById.get(r.sellerId);
    const displayName = u?.displayName ?? u?.name ?? "Unknown seller";
    return {
      id: r.sellerId,
      name: displayName,
      sold: r._count._all,
      active: activeCountBySeller.get(r.sellerId) ?? 0,
      gmvCents: r._sum.priceCents ?? 0,
    };
  });

  return (
    <OwnerShell slug={params.slug}>
      <style dangerouslySetInnerHTML={{ __html: analyticsCss }} />
      <main className="an-body">
        <div className="page-head">
          <div>
            <h1>
              How <em>{marketplace.name}</em> is trending
            </h1>
            <div className="lead">
              The last 30 days — member growth, listing velocity, engagement. A pulse, not a dashboard to stare at.
            </div>
          </div>
          <div className="range-picker" role="tablist" aria-label="Time range">
            <button type="button">7d</button>
            <button type="button" className="on" aria-pressed="true">30d</button>
            <button type="button">90d</button>
            <button type="button">All</button>
          </div>
        </div>

        <div className="kpi-grid">
          <KpiCard
            testId="kpi-members"
            label="Members"
            icon={
              <>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </>
            }
            value={memberTotal.toLocaleString()}
            delta={memberDelta}
            deltaPct={memberPct}
            deltaSuffix="this period"
            sparkValues={memberSeries}
            stroke="var(--success)"
            fill="var(--success-soft)"
          />
          <KpiCard
            testId="kpi-listings"
            label="Active listings"
            icon={
              <>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
              </>
            }
            value={activeTotal.toLocaleString()}
            delta={listingDelta}
            deltaPct={listingPct}
            deltaSuffix={`${newListings} posted`}
            sparkValues={listingSeries}
            stroke="var(--blue)"
            fill="var(--blue-softer)"
          />
          <KpiCard
            testId="kpi-gmv"
            label="Gross sales volume"
            icon={
              <>
                <path d="M3 3v18h18" />
                <path d="m7 14 4-4 4 4 5-5" />
              </>
            }
            value={shortCurrency(gmvCents)}
            delta={gmvDelta}
            deltaPct={gmvPct}
            deltaSuffix={`${soldAgg._count} ${soldAgg._count === 1 ? "sale" : "sales"}`}
            deltaDisplay={gmvDelta === 0 ? "flat" : `${gmvDelta > 0 ? "+" : "−"}${shortCurrency(Math.abs(gmvDelta))}`}
            sparkValues={soldByDay}
            stroke="oklch(0.55 0.18 280)"
            fill="oklch(0.95 0.04 280)"
          />
        </div>

        <div className="chart-grid">
          <div className="panel" data-testid="analytics-growth-chart">
            <div className="panel-hd">
              <h3>Member growth & listing activity</h3>
              <div className="chart-legend">
                <span>
                  <span className="dot" style={{ background: "var(--success)" }} />
                  New members
                </span>
                <span>
                  <span className="dot" style={{ background: "var(--blue)" }} />
                  New listings
                </span>
              </div>
            </div>
            <div className="chart-wrap">
              <svg
                className="chart-svg"
                viewBox="0 0 600 220"
                preserveAspectRatio="none"
                role="img"
                aria-label="Member and listing trend over the last 30 days"
              >
                {[40, 90, 140, 190].map((y) => (
                  <line key={y} className="gridline" x1="40" y1={y} x2="600" y2={y} />
                ))}
                {[4, 3, 2, 1].map((mult, idx) => {
                  const y = 40 + idx * 50 + 4;
                  const label = gridStep * mult;
                  return (
                    <text key={mult} className="axis-lbl" x="8" y={y}>
                      {label}
                    </text>
                  );
                })}
                {[0, 1, 2, 3, 4].map((w) => {
                  const x = 40 + ((600 - 40) * w) / 4;
                  const label = w === 4 ? "Now" : `W-${4 - w}`;
                  return (
                    <text key={w} className="axis-lbl" x={x - 10} y={210}>
                      {label}
                    </text>
                  );
                })}
                <path
                  data-series="members"
                  data-kind="area"
                  d={linePath(memberSeries, {
                    x0: 40,
                    x1: 600,
                    y0: 40,
                    y1: 190,
                    yMax: yMaxRounded,
                    closeToBaseline: true,
                  })}
                  fill="var(--success-soft)"
                  opacity="0.55"
                />
                <path
                  data-series="members"
                  d={linePath(memberSeries, {
                    x0: 40,
                    x1: 600,
                    y0: 40,
                    y1: 190,
                    yMax: yMaxRounded,
                  })}
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <path
                  data-series="listings"
                  d={linePath(listingSeries, {
                    x0: 40,
                    x1: 600,
                    y0: 40,
                    y1: 190,
                    yMax: yMaxRounded,
                  })}
                  fill="none"
                  stroke="var(--blue)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Latest-point dots to match design treatment. */}
                {memberSeries.length > 0 && (
                  <circle
                    cx={600}
                    cy={190 - (Math.min(memberSeries[memberSeries.length - 1], yMaxRounded) / Math.max(1, yMaxRounded)) * 150}
                    r="4"
                    fill="#fff"
                    stroke="var(--success)"
                    strokeWidth={2}
                  />
                )}
                {listingSeries.length > 0 && (
                  <circle
                    cx={600}
                    cy={190 - (Math.min(listingSeries[listingSeries.length - 1], yMaxRounded) / Math.max(1, yMaxRounded)) * 150}
                    r="4"
                    fill="#fff"
                    stroke="var(--blue)"
                    strokeWidth={2}
                  />
                )}
              </svg>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd">
            <h3>This month's top performers</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Last 30 days</span>
          </div>
          <div className="top-grid">
            <div className="top-col" data-testid="top-sellers">
              <div className="col-hd">Top sellers</div>
              {topSellers.length === 0 ? (
                <div className="empty">No sales yet in this period.</div>
              ) : (
                topSellers.map((s, i) => (
                  <div key={s.id} className="top-row">
                    <span className="rank">{i + 1}</span>
                    <div className="av" style={{ background: avatarGradient(s.id) }}>
                      {initials(s.name, "??")}
                    </div>
                    <div className="tr-body">
                      <div className="tr-name">{s.name}</div>
                      <div className="tr-meta">
                        {s.sold} sold · {s.active} active
                      </div>
                    </div>
                    <div className="tr-val">{shortCurrency(s.gmvCents)}</div>
                  </div>
                ))
              )}
            </div>
            <div className="top-col" data-testid="top-listings">
              <div className="col-hd">Most viewed listings</div>
              {topListings.length === 0 ? (
                <div className="empty">No listings yet.</div>
              ) : (
                topListings.map((l, i) => (
                  <div key={l.id} className="top-row">
                    <span className="rank">{i + 1}</span>
                    <div className="av sq" />
                    <div className="tr-body">
                      <div className="tr-name">{l.title}</div>
                      <div className="tr-meta">
                        by {l.seller.displayName ?? l.seller.name ?? "seller"}
                      </div>
                    </div>
                    <div className="tr-val">{l.views.toLocaleString()}</div>
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

function KpiCard({
  testId,
  label,
  icon,
  value,
  delta,
  deltaPct,
  deltaSuffix,
  deltaDisplay,
  sparkValues,
  stroke,
  fill,
}: {
  testId: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  delta: number;
  deltaPct: number | null;
  deltaSuffix: string;
  deltaDisplay?: string;
  sparkValues: number[];
  stroke: string;
  fill: string;
}) {
  const up = delta > 0;
  const down = delta < 0;
  const deltaClass = up ? "k-delta up" : down ? "k-delta down" : "k-delta";
  const arrow = up ? "m6 15 6-6 6 6" : down ? "m6 9 6 6 6-6" : null;
  const main =
    deltaDisplay ?? (delta === 0 ? "No change" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`);
  const pct = deltaPct != null ? ` · ${deltaPct > 0 ? "+" : ""}${deltaPct}%` : "";
  const sparkPath = linePath(sparkValues, {
    x0: 0,
    x1: 200,
    y0: 4,
    y1: 36,
    yMax: Math.max(1, ...sparkValues),
  });
  const sparkArea = linePath(sparkValues, {
    x0: 0,
    x1: 200,
    y0: 4,
    y1: 36,
    yMax: Math.max(1, ...sparkValues),
    closeToBaseline: true,
  });
  return (
    <div className="kpi" data-testid={testId}>
      <div className="k-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
        {label}
      </div>
      <div className="k-num">{value}</div>
      <div className={deltaClass}>
        {arrow && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={arrow} />
          </svg>
        )}
        {main}
        {pct} · {deltaSuffix}
      </div>
      <div className="k-spark" data-testid="kpi-spark">
        <svg viewBox="0 0 200 40" preserveAspectRatio="none">
          <path d={sparkArea} fill={fill} opacity="0.6" />
          <path d={sparkPath} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
