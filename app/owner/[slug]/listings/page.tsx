import Link from "next/link";
import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { formatCents, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tab = "pending" | "flagged" | "active";

function parseTab(v: string | string[] | undefined): Tab {
  const raw = Array.isArray(v) ? v[0] : v;
  if (raw === "pending" || raw === "flagged" || raw === "active") return raw;
  return "pending";
}

const listingsCss = `
.list-body { padding: 28px 32px; min-width: 0; }
.list-body .page-head { margin-bottom: 22px; }
.list-body .page-head h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 34px; line-height: 1.05; letter-spacing: -0.01em; }
.list-body .page-head .lead { font-size: 13px; color: var(--muted); margin-top: 6px; max-width: 560px; }

.list-body .listing-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--line); }
.list-body .listing-tabs a { padding: 10px 14px; font-size: 13px; color: var(--muted); font-weight: 500; border-bottom: 2px solid transparent; margin-bottom: -1px; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; text-decoration: none; }
.list-body .listing-tabs a:hover { color: var(--ink); }
.list-body .listing-tabs a.on { color: var(--ink); border-bottom-color: var(--ink); font-weight: 600; }
.list-body .listing-tabs .tab-count { font-size: 10.5px; font-weight: 700; padding: 1px 6px; border-radius: 999px; background: var(--bg-soft); color: var(--muted); }
.list-body .listing-tabs a.on .tab-count { background: var(--ink); color: #fff; }

.list-body .listing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 16px; }

.list-body .listing-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: all 0.12s; text-decoration: none; color: inherit; }
.list-body .listing-card:hover { border-color: oklch(0.8 0.02 230); box-shadow: var(--shadow); }
.list-body .listing-card .lc-media { height: 180px; position: relative; display: grid; place-items: center; background: linear-gradient(135deg, oklch(0.4 0.08 25), oklch(0.25 0.06 25)); overflow: hidden; }
.list-body .listing-card .lc-media img { width: 100%; height: 100%; object-fit: cover; }
.list-body .listing-card .lc-status { position: absolute; top: 10px; left: 10px; z-index: 2; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background: #fff; color: var(--ink); letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; }
.list-body .listing-card .lc-status.pending { background: oklch(0.55 0.15 65); color: #fff; }
.list-body .listing-card .lc-status.edited { background: var(--blue); color: #fff; }
.list-body .listing-card .lc-status.auction { background: var(--ink); color: #fff; }
.list-body .listing-card .lc-status.wanted { background: oklch(0.55 0.15 60); color: #fff; }
.list-body .listing-card .lc-status.flagged { background: var(--danger); color: #fff; }
.list-body .listing-card .lc-count { position: absolute; top: 10px; right: 10px; z-index: 2; font-size: 10.5px; color: #fff; font-weight: 500; padding: 3px 8px; background: rgba(0, 0, 0, 0.5); border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; }

.list-body .listing-card .lc-body { padding: 14px; flex: 1; display: flex; flex-direction: column; }
.list-body .listing-card .lc-t { font-size: 13.5px; font-weight: 600; letter-spacing: -0.005em; line-height: 1.3; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.list-body .listing-card .lc-p { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 18px; color: var(--ink); margin: 4px 0 8px; letter-spacing: -0.005em; }
.list-body .listing-card .lc-specs { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
.list-body .listing-card .lc-spec { font-size: 10.5px; padding: 2px 7px; border-radius: 4px; background: var(--bg-soft); color: var(--muted); border: 1px solid var(--line-soft); font-weight: 500; white-space: nowrap; }
.list-body .listing-card .lc-seller { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--muted); padding-top: 10px; border-top: 1px solid var(--line-soft); margin-top: auto; }
.list-body .listing-card .lc-seller .av-sm { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 10px; font-weight: 600; flex: none; overflow: hidden; }
.list-body .listing-card .lc-seller .av-sm img { width: 100%; height: 100%; object-fit: cover; }
.list-body .listing-card .lc-seller b { color: var(--ink); font-weight: 600; }
.list-body .listing-card .lc-actions { display: flex; gap: 6px; padding: 10px 14px; border-top: 1px solid var(--line-soft); background: var(--bg-soft); }
.list-body .listing-card .lc-actions a, .list-body .listing-card .lc-actions button { flex: 1; padding: 6px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 500; text-align: center; text-decoration: none; cursor: pointer; border: 0; }
.list-body .listing-card .lc-actions .approve { background: var(--ink); color: #fff; }
.list-body .listing-card .lc-actions .approve:hover { background: oklch(0.28 0.03 240); }
.list-body .listing-card .lc-actions .request { background: #fff; color: var(--ink); border: 1px solid var(--line); }
.list-body .listing-card .lc-actions .request:hover { background: var(--hover); }
.list-body .listing-card .lc-actions .review-link { background: transparent; color: var(--muted); }

.list-body .empty-state { padding: 60px 24px; text-align: center; color: var(--muted); font-size: 13px; background: #fff; border: 1px solid var(--line); border-radius: 12px; }
`;

const GRADIENTS = [
  "linear-gradient(135deg, oklch(0.4 0.08 25), oklch(0.25 0.06 25))",
  "linear-gradient(135deg, oklch(0.42 0.1 240), oklch(0.25 0.06 240))",
  "linear-gradient(135deg, oklch(0.75 0.01 240), oklch(0.55 0.01 240))",
  "linear-gradient(135deg, oklch(0.72 0.13 85), oklch(0.5 0.1 70))",
  "linear-gradient(135deg, oklch(0.25 0.01 240), oklch(0.12 0.005 240))",
  "linear-gradient(135deg, oklch(0.42 0.08 150), oklch(0.24 0.05 150))",
];

const SELLER_GRADIENTS = [
  "linear-gradient(135deg, oklch(0.65 0.15 260), oklch(0.45 0.12 260))",
  "linear-gradient(135deg, oklch(0.62 0.16 30), oklch(0.42 0.13 30))",
  "linear-gradient(135deg, oklch(0.55 0.14 155), oklch(0.35 0.1 155))",
  "linear-gradient(135deg, oklch(0.58 0.13 80), oklch(0.38 0.1 80))",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export default async function ListingsModerationPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { tab?: string };
}) {
  const { marketplace } = await requireOwnerOf(params.slug);
  const tab = parseTab(searchParams?.tab);

  const where = (() => {
    if (tab === "pending")
      return { marketplaceId: marketplace.id, status: "PENDING_REVIEW" as const };
    if (tab === "flagged")
      return {
        marketplaceId: marketplace.id,
        OR: [
          { status: "SHADOW_HIDDEN" as const },
          { reports: { some: { resolved: false } } },
        ],
      };
    return { marketplaceId: marketplace.id, status: "ACTIVE" as const };
  })();

  const [listings, pendingCount, flaggedCount, activeCount] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        seller: { select: { id: true, displayName: true, name: true, image: true } },
        _count: { select: { reports: { where: { resolved: false } } } },
      },
    }),
    prisma.listing.count({
      where: { marketplaceId: marketplace.id, status: "PENDING_REVIEW" },
    }),
    prisma.listing.count({
      where: {
        marketplaceId: marketplace.id,
        OR: [{ status: "SHADOW_HIDDEN" }, { reports: { some: { resolved: false } } }],
      },
    }),
    prisma.listing.count({
      where: { marketplaceId: marketplace.id, status: "ACTIVE" },
    }),
  ]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "pending", label: "Pending review", count: pendingCount },
    { key: "flagged", label: "Flagged", count: flaggedCount },
    { key: "active", label: "Active", count: activeCount },
  ];

  return (
    <OwnerShell slug={params.slug}>
      <style dangerouslySetInnerHTML={{ __html: listingsCss }} />
      <main className="list-body">
        <div className="page-head">
          <h1>Listing moderation</h1>
          <div className="lead">
            Review, approve, or remove listings in {marketplace.name}. Moderation queue
            is task-first — approve the good stuff, kick back the rest.
          </div>
        </div>

        <nav className="listing-tabs" aria-label="Listing tabs">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/owner/${params.slug}/listings?tab=${t.key}`}
              scroll={false}
              className={t.key === tab ? "on" : ""}
              data-testid={`listings-tab-${t.key}`}
            >
              {t.label}
              <span className="tab-count">{t.count}</span>
            </Link>
          ))}
        </nav>

        {listings.length === 0 ? (
          <div className="empty-state">
            {tab === "pending"
              ? "No listings waiting for review. New submissions will appear here."
              : tab === "flagged"
                ? "Nothing flagged right now."
                : "No active listings yet."}
          </div>
        ) : (
          <div className="listing-grid">
            {listings.map((l, i) => {
              const sellerName = l.seller.displayName ?? l.seller.name ?? "Seller";
              const sellerGradient =
                SELLER_GRADIENTS[i % SELLER_GRADIENTS.length];
              const gradient = GRADIENTS[i % GRADIENTS.length];
              const statusLabel = (() => {
                if (l.status === "PENDING_REVIEW")
                  return l.editedAt ? "edited" : "pending";
                if (l.status === "SHADOW_HIDDEN") return "flagged";
                if (l.type === "AUCTION") return "auction";
                if (l.type === "ISO") return "wanted";
                return "live";
              })();
              const statusText = (() => {
                if (statusLabel === "pending") return "Pending";
                if (statusLabel === "edited") return "Edited";
                if (statusLabel === "auction") return "Auction";
                if (statusLabel === "wanted") return "ISO";
                if (statusLabel === "flagged") return "Flagged";
                return "Live";
              })();
              const reportCount = l._count.reports;
              return (
                <div key={l.id} className="listing-card">
                  <Link
                    href={`/l/${l.id}`}
                    style={{ display: "contents", textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      className="lc-media"
                      style={l.images[0] ? undefined : { background: gradient }}
                    >
                      {l.images[0] && <img src={l.images[0]} alt="" />}
                      <span className={`lc-status ${statusLabel}`}>{statusText}</span>
                      {reportCount > 0 && (
                        <span className="lc-count">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" />
                          </svg>
                          {reportCount} report{reportCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                    <div className="lc-body">
                      <div className="lc-t">{l.title}</div>
                      <div className="lc-p">
                        {l.priceCents != null
                          ? formatCents(l.priceCents, l.currency ?? "USD")
                          : l.type === "ISO"
                            ? "Wanted"
                            : "—"}
                      </div>
                      <div className="lc-specs">
                        <span className="lc-spec">{timeAgo(l.createdAt)}</span>
                        {l.type === "AUCTION" && <span className="lc-spec">Auction</span>}
                        {l.type === "ISO" && <span className="lc-spec">ISO</span>}
                      </div>
                      <div className="lc-seller">
                        <div
                          className="av-sm"
                          style={{ background: sellerGradient }}
                        >
                          {l.seller.image ? (
                            <img src={l.seller.image} alt="" />
                          ) : (
                            initials(sellerName)
                          )}
                        </div>
                        <span>
                          <b>{sellerName}</b>
                        </span>
                      </div>
                    </div>
                  </Link>
                  {tab === "pending" && (
                    <div className="lc-actions">
                      <form
                        action={`/api/listings/${l.id}/moderate`}
                        method="post"
                        style={{ display: "contents" }}
                      >
                        <input type="hidden" name="decision" value="approve" />
                        <button type="submit" className="approve">
                          Approve
                        </button>
                      </form>
                      <Link
                        href={`/l/${l.id}`}
                        className="request"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                      >
                        Review
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </OwnerShell>
  );
}
