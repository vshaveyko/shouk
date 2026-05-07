import { prisma } from "@/lib/prisma";

/**
 * Server-side data loader for the Flow 8 sectioned dashboard.
 *
 * Each section maps onto the schema as follows:
 *   Listings · Active/Drafts/Sold → Listing where sellerId = me, by status
 *   ISO     · Open/Matches/Closed → Listing.type === ISO  +  ISO_MATCH notifications
 *   Alerts  · Active/Matches      → SavedSearch  +  NEW_LISTING_MATCH notifications
 *   Purchases                     → not modeled (no buyerId/Order entity); always empty
 *
 * Counts are returned alongside rows so the sidebar reflects real totals.
 */

export type DashboardListingRow = {
  id: string;
  title: string;
  marketplaceName: string;
  marketplaceSlug: string;
  marketplaceColor: string | null;
  status: string;
  type: string;
  priceCents: number | null;
  cover: string | null;
  bidCount: number;
  watcherCount: number;
  views: number;
  publishedAt: Date | null;
  soldAt: Date | null;
  createdAt: Date;
  auctionEndsAt: Date | null;
};

export type DashboardIsoMatchRow = {
  id: string;
  title: string;
  preview: string | null;
  marketplaceName: string;
  marketplaceColor: string | null;
  isoListingId: string | null;
  createdAt: Date;
  unread: boolean;
};

export type DashboardIsoMatchGroup = {
  isoListingId: string;
  isoTitle: string;
  marketplaceName: string;
  marketplaceColor: string | null;
  newCount: number;
  rows: DashboardIsoMatchRow[];
};

export type DashboardSavedSearch = {
  id: string;
  name: string;
  marketplaceName: string;
  marketplaceColor: string | null;
  frequency: string;
  query: Record<string, unknown>;
  createdAt: Date;
};

export type DashboardAlertMatchGroup = {
  savedSearchId: string | null;
  marketplaceName: string;
  marketplaceColor: string | null;
  newCount: number;
  rows: Array<{
    id: string;
    title: string;
    preview: string | null;
    deeplink: string | null;
    createdAt: Date;
    unread: boolean;
  }>;
};

export type DashboardData = {
  listings: {
    active: DashboardListingRow[];
    drafts: DashboardListingRow[];
    sold: DashboardListingRow[];
    counts: { active: number; drafts: number; sold: number; total: number };
  };
  iso: {
    open: DashboardListingRow[];
    matches: DashboardIsoMatchGroup[];
    closed: DashboardListingRow[];
    counts: { open: number; matches: number; newMatches: number; closed: number; total: number };
  };
  alerts: {
    active: DashboardSavedSearch[];
    matches: DashboardAlertMatchGroup[];
    counts: { active: number; matches: number; newMatches: number; total: number };
  };
  purchases: {
    items: never[];
    counts: { total: 0 };
  };
};

const SOLD_STATUSES = ["SOLD", "CLOSED", "RESERVE_NOT_MET", "WON"] as const;

function toRow(l: {
  id: string;
  title: string;
  type: string;
  status: string;
  priceCents: number | null;
  images: string[];
  views: number;
  publishedAt: Date | null;
  soldAt: Date | null;
  createdAt: Date;
  auctionEndsAt: Date | null;
  marketplace: { name: string; slug: string; primaryColor: string | null };
  _count: { bids: number; saves: number };
}): DashboardListingRow {
  return {
    id: l.id,
    title: l.title,
    marketplaceName: l.marketplace.name,
    marketplaceSlug: l.marketplace.slug,
    marketplaceColor: l.marketplace.primaryColor,
    status: l.status,
    type: l.type,
    priceCents: l.priceCents,
    cover: l.images[0] ?? null,
    bidCount: l._count.bids,
    watcherCount: l._count.saves,
    views: l.views,
    publishedAt: l.publishedAt,
    soldAt: l.soldAt,
    createdAt: l.createdAt,
    auctionEndsAt: l.auctionEndsAt,
  };
}

export async function loadDashboardData(userId: string): Promise<DashboardData> {
  const listingInclude = {
    marketplace: { select: { name: true, slug: true, primaryColor: true } },
    _count: { select: { bids: true, saves: true } },
  } as const;

  const [
    activeListings,
    draftListings,
    soldListings,
    openIso,
    closedIso,
    isoMatches,
    savedSearches,
    alertMatches,
  ] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: userId, type: { in: ["FIXED", "AUCTION"] }, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: listingInclude,
    }),
    prisma.listing.findMany({
      where: { sellerId: userId, status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      include: listingInclude,
    }),
    prisma.listing.findMany({
      where: { sellerId: userId, status: { in: [...SOLD_STATUSES] } },
      orderBy: { soldAt: "desc" },
      include: listingInclude,
    }),
    prisma.listing.findMany({
      where: { sellerId: userId, type: "ISO", status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: listingInclude,
    }),
    prisma.listing.findMany({
      where: { sellerId: userId, type: "ISO", status: { in: ["CLOSED", "REMOVED"] } },
      orderBy: { closedAt: "desc" },
      include: listingInclude,
    }),
    prisma.notification.findMany({
      where: { userId, kind: "ISO_MATCH" },
      orderBy: { createdAt: "desc" },
      include: { marketplace: { select: { name: true, slug: true, primaryColor: true } } },
    }),
    prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { marketplace: { select: { name: true, slug: true, primaryColor: true } } },
    }),
    prisma.notification.findMany({
      where: { userId, kind: "NEW_LISTING_MATCH" },
      orderBy: { createdAt: "desc" },
      include: { marketplace: { select: { name: true, slug: true, primaryColor: true } } },
    }),
  ]);

  // ── ISO matches: group by referenced ISO listing if data carries one,
  // otherwise group by marketplace as a fallback.
  const isoMatchGroups = new Map<string, DashboardIsoMatchGroup>();
  for (const n of isoMatches) {
    const data = (n.data ?? {}) as { isoListingId?: string };
    const groupKey = data.isoListingId ?? `mp:${n.marketplaceId ?? "_"}`;
    const group = isoMatchGroups.get(groupKey) ?? {
      isoListingId: data.isoListingId ?? "",
      isoTitle: data.isoListingId
        ? openIso.find((o) => o.id === data.isoListingId)?.title ?? "Wanted listing"
        : `Matches in ${n.marketplace?.name ?? "your marketplaces"}`,
      marketplaceName: n.marketplace?.name ?? "—",
      marketplaceColor: n.marketplace?.primaryColor ?? null,
      newCount: 0,
      rows: [],
    };
    const unread = n.readAt == null;
    if (unread) group.newCount += 1;
    group.rows.push({
      id: n.id,
      title: n.title,
      preview: n.preview,
      marketplaceName: n.marketplace?.name ?? "—",
      marketplaceColor: n.marketplace?.primaryColor ?? null,
      isoListingId: data.isoListingId ?? null,
      createdAt: n.createdAt,
      unread,
    });
    isoMatchGroups.set(groupKey, group);
  }

  // ── Alert matches: group by savedSearchId (when stored in data),
  // otherwise by marketplace.
  const alertMatchGroups = new Map<string, DashboardAlertMatchGroup>();
  for (const n of alertMatches) {
    const data = (n.data ?? {}) as { savedSearchId?: string };
    const groupKey = data.savedSearchId ?? `mp:${n.marketplaceId ?? "_"}`;
    const group = alertMatchGroups.get(groupKey) ?? {
      savedSearchId: data.savedSearchId ?? null,
      marketplaceName: n.marketplace?.name ?? "—",
      marketplaceColor: n.marketplace?.primaryColor ?? null,
      newCount: 0,
      rows: [],
    };
    const unread = n.readAt == null;
    if (unread) group.newCount += 1;
    group.rows.push({
      id: n.id,
      title: n.title,
      preview: n.preview,
      deeplink: n.deeplink,
      createdAt: n.createdAt,
      unread,
    });
    alertMatchGroups.set(groupKey, group);
  }

  const isoMatchesArr = [...isoMatchGroups.values()];
  const alertMatchesArr = [...alertMatchGroups.values()];
  const isoNewMatches = isoMatchesArr.reduce((s, g) => s + g.newCount, 0);
  const alertNewMatches = alertMatchesArr.reduce((s, g) => s + g.newCount, 0);

  return {
    listings: {
      active: activeListings.map(toRow),
      drafts: draftListings.map(toRow),
      sold: soldListings.map(toRow),
      counts: {
        active: activeListings.length,
        drafts: draftListings.length,
        sold: soldListings.length,
        total: activeListings.length + draftListings.length + soldListings.length,
      },
    },
    iso: {
      open: openIso.map(toRow),
      matches: isoMatchesArr,
      closed: closedIso.map(toRow),
      counts: {
        open: openIso.length,
        matches: isoMatches.length,
        newMatches: isoNewMatches,
        closed: closedIso.length,
        total: openIso.length + isoMatches.length + closedIso.length,
      },
    },
    alerts: {
      active: savedSearches.map((s) => ({
        id: s.id,
        name: s.name,
        marketplaceName: s.marketplace.name,
        marketplaceColor: s.marketplace.primaryColor,
        frequency: s.frequency,
        query: s.query as Record<string, unknown>,
        createdAt: s.createdAt,
      })),
      matches: alertMatchesArr,
      counts: {
        active: savedSearches.length,
        matches: alertMatches.length,
        newMatches: alertNewMatches,
        total: savedSearches.length + alertMatches.length,
      },
    },
    purchases: { items: [], counts: { total: 0 } },
  };
}
