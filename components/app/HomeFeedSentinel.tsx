"use client";

import * as React from "react";
import Link from "next/link";

type FeedItem = {
  id: string;
  title: string;
  type: string;
  images: string[];
  priceCents: number | null;
  auctionStartCents: number | null;
  auctionEndsAt: string | null;
  createdAt: string;
  bidCount: number;
  marketplace: { name: string; slug: string; primaryColor: string | null };
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function timeUntilShort(toIso: string) {
  const ms = new Date(toIso).getTime() - Date.now();
  if (ms <= 0) return "ended";
  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// SHK-055: infinite-scroll loader for the home Listings feed. Lives below
// the SSR'd first page; once the sentinel scrolls into view it fetches
// the next page from /api/feed?cursor=… and appends to the DOM.
export function HomeFeedSentinel({ initialCursor }: { initialCursor: string | null }) {
  const [items, setItems] = React.useState<FeedItem[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(initialCursor);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(initialCursor === null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const fetchingRef = React.useRef(false);

  const loadMore = React.useCallback(async () => {
    if (fetchingRef.current || done || !cursor) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}&take=8`);
      if (!res.ok) {
        setDone(true);
        return;
      }
      const json = (await res.json()) as { items: FeedItem[]; nextCursor: string | null };
      setItems((prev) => [...prev, ...json.items]);
      setCursor(json.nextCursor);
      if (!json.nextCursor) setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [cursor, done]);

  React.useEffect(() => {
    if (done || !sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: "320px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore, done]);

  return (
    <>
      {items.map((l) => {
        const color = l.marketplace.primaryColor ?? "oklch(0.55 0.17 25)";
        const cover = l.images[0];
        const isIso = l.type === "ISO";
        const isAuction = l.type === "AUCTION";
        const hoursOld = (Date.now() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60);
        const fresh = hoursOld < 24;
        const priceCents = isAuction
          ? l.auctionStartCents ?? l.priceCents ?? 0
          : l.priceCents ?? 0;
        const postedLabel =
          hoursOld < 1
            ? "Just posted"
            : hoursOld < 24
              ? `${Math.max(1, Math.round(hoursOld))}h ago`
              : `${Math.max(1, Math.round(hoursOld / 24))}d ago`;
        const auctionEndsIn = l.auctionEndsAt ? timeUntilShort(l.auctionEndsAt) : null;
        return (
          <Link key={l.id} href={`/l/${l.id}`} className="feed-item" data-testid="feed-item">
            {isIso ? (
              <div className="fi-iso">?</div>
            ) : (
              <div
                className="fi-img"
                style={{
                  background: cover
                    ? `url(${cover}) center/cover`
                    : `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 50%, black))`,
                }}
              >
                {isAuction && auctionEndsIn ? (
                  <span className="chip auction">Auction · {auctionEndsIn}</span>
                ) : fresh ? (
                  <span className="chip">New</span>
                ) : null}
              </div>
            )}
            <div className="fi-body">
              <div className="fi-top">
                <div style={{ minWidth: 0 }}>
                  <div className="fi-mp">
                    <span className="dot" style={{ background: color }} />
                    {l.marketplace.name}
                  </div>
                  <div className="fi-title">{l.title}</div>
                </div>
              </div>
              <div className="fi-bottom">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {isIso ? (
                    <span className="fi-iso-price">
                      Looking for{priceCents > 0 ? ` · up to ${formatMoney(priceCents)}` : ""}
                    </span>
                  ) : (
                    <span className="fi-price">{formatMoney(priceCents)}</span>
                  )}
                  {isIso ? (
                    <span className="fi-tag match">Wanted</span>
                  ) : fresh ? (
                    <span className="fi-tag new">New</span>
                  ) : isAuction ? (
                    <span className="fi-tag ending">Live</span>
                  ) : null}
                </div>
                <span className="fi-meta">
                  {isAuction && l.bidCount > 0 && <span>{l.bidCount} bids</span>}
                  <span>Posted {postedLabel}</span>
                </span>
              </div>
            </div>
          </Link>
        );
      })}

      {!done && (
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden data-testid="home-feed-sentinel" />
      )}
      {loading && (
        <div style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: "var(--muted)" }}>
          Loading…
        </div>
      )}
    </>
  );
}
