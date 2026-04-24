"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { formatCents, timeAgo, formatDuration } from "@/lib/utils";

type Listing = {
  id: string;
  title: string;
  type: "FIXED" | "AUCTION" | "ISO";
  status: string;
  images: string[];
  priceCents: number | null;
  currency: string;
  createdAt: string;
  auctionEndsAt: string | null;
  auctionStartCents: number | null;
  seller: { id: string; displayName: string | null; image: string | null };
  bidCount: number;
  saveCount: number;
  isSaved: boolean;
};

type Props = {
  slug: string;
  marketplaceName: string;
  auctionsEnabled: boolean;
  primaryColor: string | null;
  activeListingCount: number;
  memberCount: number;
  myListingsCount: number;
  initialListings: Listing[];
  initialQuery: string;
  initialType: string;
  initialSort: string;
};

// Ported from design_handoff_shouks_mvp/Flow 6 - Core App Shell.html  · 6B.
// Class names mirror the design (.mp-toolbar, .active-chips, .listings-grid,
// .listing, .listing-img, .listing-body) so future visual edits map 1:1.
const mpBrowseCss = `
.mp-toolbar { display: flex; align-items: center; padding: 12px 24px; gap: 10px; border-bottom: 1px solid var(--line); background: #fff; flex-wrap: wrap; max-width: 1440px; margin: 0 auto; }
.mp-toolbar .search-big { flex: 1; height: 38px; border-radius: 9px; background: var(--bg-soft); border: 1px solid var(--line); display: flex; align-items: center; padding: 0 12px; gap: 10px; color: var(--muted); font-size: 13px; max-width: 420px; min-width: 240px; }
.mp-toolbar .search-big:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-soft); }
.mp-toolbar .search-big svg { width: 14px; height: 14px; flex: none; }
.mp-toolbar .search-big input { border: 0; background: transparent; outline: 0; flex: 1; font: inherit; color: var(--ink); }
.mp-toolbar .chip-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 11px; border-radius: 8px; font-size: 12.5px; background: var(--bg-soft); border: 1px solid var(--line); color: var(--ink-soft); cursor: pointer; font-weight: 500; }
.mp-toolbar .chip-btn:hover { background: var(--hover); }
.mp-toolbar .chip-btn svg { width: 13px; height: 13px; }
.mp-toolbar .chip-btn.on { background: var(--ink); color: #fff; border-color: var(--ink); }
.mp-toolbar .chip-btn .badge { background: oklch(0.55 0.15 60); color: #fff; padding: 1px 6px; border-radius: 4px; font-size: 10px; margin-left: 2px; }
.mp-toolbar .spacer { flex: 1; }
.mp-toolbar select.chip-btn { appearance: none; background: #fff; padding-right: 26px; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>"); background-repeat: no-repeat; background-position: right 8px center; background-size: 12px; }

.active-chips { display: flex; gap: 6px; padding: 10px 24px 0; flex-wrap: wrap; max-width: 1440px; margin: 0 auto; }
.active-chips .chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 999px; background: var(--blue-soft); color: var(--blue-ink); font-size: 11.5px; font-weight: 500; }
.active-chips .chip button { color: inherit; background: transparent; border: 0; padding: 0; cursor: pointer; display: inline-flex; }
.active-chips .chip svg { width: 11px; height: 11px; }

.listings-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; padding: 18px 24px 36px; max-width: 1440px; margin: 0 auto; }
@media (max-width: 1200px) { .listings-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 900px) { .listings-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .listings-grid { grid-template-columns: 1fr; } }

.listing { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; display: block; color: inherit; text-decoration: none; transition: border-color 140ms, transform 140ms; }
.listing:hover { border-color: oklch(0.82 0.004 60); transform: translateY(-1px); }
.listing-img { height: 160px; background: oklch(0.92 0.01 240); position: relative; background-size: cover; background-position: center; }
.listing-badge { position: absolute; top: 8px; left: 8px; z-index: 2; font-size: 10px; padding: 3px 7px; border-radius: 5px; font-weight: 600; background: #fff; color: var(--ink); display: inline-flex; align-items: center; gap: 4px; }
.listing-badge.auction { background: oklch(0.72 0.13 70); color: #fff; }
.listing-badge.wanted { background: oklch(0.55 0.15 60); color: #fff; }
.listing-badge.new { background: var(--ink); color: #fff; }
.listing.wanted .listing-img { background: linear-gradient(135deg, oklch(0.96 0.03 85), oklch(0.88 0.08 75)); display: flex; align-items: center; justify-content: center; color: oklch(0.5 0.12 65); }
.listing.wanted .listing-img::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(45deg, transparent 0 14px, oklch(0.5 0.12 65 / 0.06) 14px 15px); pointer-events: none; }
.listing.wanted .listing-img .iso-glyph { width: 46px; height: 46px; border-radius: 50%; background: rgba(255,255,255,0.65); display: grid; place-items: center; position: relative; z-index: 1; }
.listing-save { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.9); display: grid; place-items: center; color: var(--ink); border: 0; cursor: pointer; }
.listing-save:hover { background: #fff; }
.listing-save svg { width: 13px; height: 13px; color: var(--ink); }
.listing-save.on { background: #fff; }
.listing-save.on svg { color: oklch(0.58 0.18 25); fill: oklch(0.58 0.18 25); }
.listing-body { padding: 10px 12px 12px; }
.listing-body .title { font-size: 13px; font-weight: 500; letter-spacing: -0.005em; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 35px; }
.listing-body .price-row { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; gap: 10px; }
.listing-body .price { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; white-space: nowrap; }
.listing-body .price .cur { font-size: 11px; color: var(--muted); font-weight: 500; margin-right: 2px; }
.listing-body .price.iso { font-size: 13px; font-weight: 500; color: oklch(0.5 0.12 65); }
.listing-body .meta { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.feed-empty-grid { grid-column: 1 / -1; background: #fff; border: 1px dashed var(--line); border-radius: 12px; padding: 48px 24px; text-align: center; color: var(--muted); font-size: 13px; }
.feed-empty-grid strong { display: block; color: var(--ink); font-weight: 600; font-size: 14.5px; margin-bottom: 4px; }
.feed-empty-grid .empty-actions { margin-top: 14px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.feed-empty-grid .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 9px; font-size: 13px; font-weight: 500; text-decoration: none; border: 0; }
.feed-empty-grid .btn-dark { background: var(--ink); color: #fff; }
`;

const typeLabels: Record<string, string> = {
  FIXED: "Buy now",
  AUCTION: "Auctions",
  ISO: "Wanted · ISO",
};

export function FeedClient({
  slug,
  marketplaceName,
  auctionsEnabled,
  activeListingCount,
  memberCount,
  myListingsCount,
  initialListings,
  initialQuery,
  initialType,
  initialSort,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [listings, setListings] = React.useState(initialListings);
  const [query, setQuery] = React.useState(initialQuery);
  const [type, setType] = React.useState(initialType || "ALL");
  const [sort, setSort] = React.useState(initialSort || "new");
  const [loading, setLoading] = React.useState(false);

  const pushUrl = React.useCallback(
    (next: { q?: string; type?: string; sort?: string }) => {
      const sp = new URLSearchParams();
      if (next.q) sp.set("q", next.q);
      if (next.type && next.type !== "ALL") sp.set("type", next.type);
      if (next.sort && next.sort !== "new") sp.set("sort", next.sort);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const refetch = React.useCallback(
    async (q: string, t: string, s: string) => {
      setLoading(true);
      try {
        const sp = new URLSearchParams();
        if (q) sp.set("q", q);
        if (t && t !== "ALL") sp.set("type", t);
        if (s) sp.set("sort", s);
        const res = await fetch(`/api/marketplaces/${slug}/listings?${sp.toString()}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setListings((prev) => {
          const prevSaved = new Map(prev.map((p) => [p.id, p.isSaved]));
          return data.map((l: any) => ({
            id: l.id,
            title: l.title,
            type: l.type,
            status: l.status,
            images: l.images ?? [],
            priceCents: l.priceCents,
            currency: l.currency ?? "USD",
            createdAt: l.createdAt,
            auctionEndsAt: l.auctionEndsAt ?? null,
            auctionStartCents: l.auctionStartCents ?? null,
            seller: l.seller,
            bidCount: l._count?.bids ?? 0,
            saveCount: l._count?.saves ?? 0,
            isSaved: prevSaved.get(l.id) ?? false,
          }));
        });
      } catch {
        toast.error("Couldn't load listings.");
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  React.useEffect(() => {
    if (query === initialQuery) return;
    const t = setTimeout(() => {
      pushUrl({ q: query, type, sort });
      refetch(query, type, sort);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function onTypeChange(next: string) {
    setType(next);
    pushUrl({ q: query, type: next, sort });
    refetch(query, next, sort);
  }

  function onSortChange(next: string) {
    setSort(next);
    pushUrl({ q: query, type, sort: next });
    refetch(query, type, next);
  }

  async function toggleSave(id: string) {
    setListings((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, isSaved: !l.isSaved, saveCount: l.saveCount + (l.isSaved ? -1 : 1) }
          : l,
      ),
    );
    try {
      const res = await fetch(`/api/listings/${id}/save`, { method: "POST" });
      if (!res.ok) throw new Error();
    } catch {
      setListings((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, isSaved: !l.isSaved, saveCount: l.saveCount + (l.isSaved ? -1 : 1) }
            : l,
        ),
      );
      toast.error("Couldn't update save.");
    }
  }

  const activeFilters: { key: string; label: string; onClear: () => void }[] = [];
  if (type !== "ALL") {
    activeFilters.push({
      key: "type",
      label: typeLabels[type] ?? type,
      onClear: () => onTypeChange("ALL"),
    });
  }
  if (query) {
    activeFilters.push({
      key: "q",
      label: `"${query}"`,
      onClear: () => {
        setQuery("");
        pushUrl({ q: "", type, sort });
        refetch("", type, sort);
      },
    });
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mpBrowseCss }} />

      <div className="mp-tabs" role="tablist" aria-label="Marketplace sections">
        <button
          type="button"
          className="active"
          data-testid="mp-tab-browse"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Browse <span className="ct">{activeListingCount.toLocaleString()}</span>
        </button>
        <Link href="/activity" className="" data-testid="mp-tab-mine">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          My listings <span className="ct">{myListingsCount}</span>
        </Link>
        <Link href={`/m/${slug}/messages`} className="" data-testid="mp-tab-messages">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          Messages
        </Link>
        <Link href={`/m/${slug}`} className="" data-testid="mp-tab-about">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          About
          {memberCount > 0 && <span className="ct">{memberCount.toLocaleString()}</span>}
        </Link>
      </div>

      <div className="mp-toolbar">
        <div className="search-big">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${marketplaceName}…`}
            data-testid="feed-search"
          />
        </div>
        {auctionsEnabled && (
          <button
            type="button"
            className={`chip-btn${type === "AUCTION" ? " on" : ""}`}
            onClick={() => onTypeChange(type === "AUCTION" ? "ALL" : "AUCTION")}
            data-testid="feed-tab-auction"
          >
            Auctions only
          </button>
        )}
        <button
          type="button"
          className={`chip-btn${type === "FIXED" ? " on" : ""}`}
          onClick={() => onTypeChange(type === "FIXED" ? "ALL" : "FIXED")}
          data-testid="feed-tab-fixed"
        >
          Buy now
        </button>
        <button
          type="button"
          className={`chip-btn${type === "ISO" ? " on" : ""}`}
          onClick={() => onTypeChange(type === "ISO" ? "ALL" : "ISO")}
          data-testid="feed-tab-iso"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Wanted · ISO
        </button>
        <div className="spacer" />
        <select
          className="chip-btn"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort listings"
          data-testid="feed-sort"
        >
          <option value="new">Sort: Newest</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
          <option value="ending">Ending soon</option>
        </select>
      </div>

      {activeFilters.length > 0 && (
        <div className="active-chips">
          {activeFilters.map((f) => (
            <span key={f.key} className="chip">
              {f.label}
              <button type="button" onClick={f.onClear} aria-label={`Clear ${f.label}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="listings-grid" data-testid="feed-grid" aria-busy={loading || undefined}>
        {listings.length === 0 ? (
          <div className="feed-empty-grid">
            <strong>{query || type !== "ALL" ? "No listings match." : "Nothing listed yet."}</strong>
            {query || type !== "ALL"
              ? "Try clearing filters or broadening your search."
              : `Be the first to list something in ${marketplaceName}.`}
            <div className="empty-actions">
              <Link href={`/m/${slug}/new`} className="btn btn-dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Post a listing
              </Link>
            </div>
          </div>
        ) : (
          listings.map((l) => <ListingCard key={l.id} listing={l} onToggleSave={toggleSave} />)
        )}
      </div>
    </>
  );
}

function ListingCard({
  listing,
  onToggleSave,
}: {
  listing: Listing;
  onToggleSave: (id: string) => void;
}) {
  const hero = listing.images[0] ?? null;
  const isAuction = listing.type === "AUCTION";
  const isISO = listing.type === "ISO";
  const ending = listing.auctionEndsAt ? formatDuration(listing.auctionEndsAt) : null;
  const hoursOld = (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60);
  const fresh = hoursOld < 24;
  const price = listing.priceCents ?? listing.auctionStartCents ?? 0;

  return (
    <Link
      href={`/l/${listing.id}`}
      className={`listing${isISO ? " wanted" : ""}`}
      data-testid={`listing-card-${listing.id}`}
    >
      <div
        className="listing-img"
        style={
          !isISO && hero
            ? { backgroundImage: `url(${hero})` }
            : undefined
        }
      >
        {isISO && (
          <div className="iso-glyph">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        )}
        {isAuction && ending ? (
          <span className="listing-badge auction">⏱ Auction · {ending}</span>
        ) : isISO ? (
          <span className="listing-badge wanted">Wanted · ISO</span>
        ) : fresh ? (
          <span className="listing-badge new">New</span>
        ) : (
          <span className="listing-badge">For Sale</span>
        )}
        {!isISO && (
          <button
            type="button"
            className={`listing-save${listing.isSaved ? " on" : ""}`}
            aria-label={listing.isSaved ? "Unsave" : "Save"}
            data-testid={`save-${listing.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave(listing.id);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>
      <div className="listing-body">
        <div className="title" data-testid="listing-title">
          {listing.title}
        </div>
        <div className="price-row">
          {isISO ? (
            <div className="price iso">
              {price > 0 ? `Budget ${formatCents(price, listing.currency)}` : "Budget open"}
            </div>
          ) : (
            <div className="price">
              <span className="cur">{listing.currency}</span>
              {formatCents(price, listing.currency).replace(/^[^\d]+/, "$")}
            </div>
          )}
          <div className="meta">
            {isAuction && listing.bidCount > 0
              ? `${listing.bidCount} bids`
              : timeAgo(listing.createdAt)}
          </div>
        </div>
      </div>
    </Link>
  );
}
