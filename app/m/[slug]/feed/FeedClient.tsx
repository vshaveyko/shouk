"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Heart, Plus, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { cn, formatCents, timeAgo, formatDuration } from "@/lib/utils";

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
  initialListings: Listing[];
  initialQuery: string;
  initialType: string;
  initialSort: string;
};

export function FeedClient({
  slug,
  auctionsEnabled,
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

  // Debounce query
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
    // optimistic
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
      // revert
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

  const tabs: { key: string; label: string }[] = [
    { key: "ALL", label: "All" },
    ...(auctionsEnabled ? [{ key: "AUCTION", label: "Auctions" }] : []),
    { key: "FIXED", label: "Buy now" },
    { key: "ISO", label: "ISO" },
  ];

  return (
    <div>
      {/* Tabs + actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
        <div className="inline-flex items-center border-b border-line -mb-px" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onTypeChange(t.key)}
              data-testid={`feed-tab-${t.key.toLowerCase()}`}
              className={cn(
                "px-3.5 py-2.5 text-[14px] font-medium border-b-2 transition-colors",
                type === t.key
                  ? "text-ink border-blue"
                  : "text-ink-soft border-transparent hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/m/${slug}/new`}>
            <Button variant="primary" size="md" className="gap-2" data-testid="create-listing-cta">
              <Plus size={16} /> New listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-[520px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings…"
            className="w-full h-[40px] pl-10 pr-3 rounded-[10px] border border-line bg-surface text-[14px] focus-visible:outline-none focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-[var(--blue-softer)]"
            data-testid="feed-search"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-muted">
            <SlidersHorizontal size={13} /> Sort
          </span>
          <div className="w-[160px]">
            <Select value={sort} onValueChange={onSortChange}>
              <SelectTrigger data-testid="feed-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Newest</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
                <SelectItem value="ending">Ending soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Filter chips row */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none mb-6 -mx-1 px-1">
        {[
          { key: "ALL", label: "All types" },
          ...(auctionsEnabled ? [{ key: "AUCTION", label: "Live auctions" }] : []),
          { key: "FIXED", label: "Fixed price" },
          { key: "ISO", label: "In search of" },
        ].map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onTypeChange(p.key)}
            className={cn(
              "px-3 h-8 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors",
              type === p.key
                ? "bg-ink text-white"
                : "bg-surface border border-line text-ink-soft hover:text-ink hover:bg-hover",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface border border-line rounded-[14px] overflow-hidden animate-pulse">
              <div className="h-[200px] bg-bg-panel" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 bg-bg-panel rounded w-3/4" />
                <div className="h-3 bg-bg-panel rounded w-1/2" />
                <div className="h-4 bg-bg-panel rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-surface border border-line rounded-[14px]">
          <EmptyState
            title={query ? "No listings match." : "Nothing listed yet."}
            description={
              query
                ? "Try a different query, or clear the filters."
                : "Be the first to list something in this marketplace."
            }
            action={
              !query ? (
                <Link href={`/m/${slug}/new`}>
                  <Button>Create a listing</Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="feed-grid">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} onToggleSave={toggleSave} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, onToggleSave }: { listing: Listing; onToggleSave: (id: string) => void }) {
  const hero = listing.images[0] ?? null;
  const isAuction = listing.type === "AUCTION";
  const isISO = listing.type === "ISO";
  const ending = listing.auctionEndsAt ? formatDuration(listing.auctionEndsAt) : null;

  return (
    <article
      className="group bg-surface border border-line rounded-[14px] overflow-hidden hover:-translate-y-0.5 hover:shadow transition-all"
      data-testid={`listing-card-${listing.id}`}
    >
      <Link href={`/l/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] bg-bg-panel overflow-hidden">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, var(--blue-softer), var(--bg-panel))",
              }}
            />
          )}

          {/* Type badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {isAuction && (
              <Badge variant="auction">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-ink mr-1 animate-pulse" />
                {ending ? `Live · ${ending}` : "Auction"}
              </Badge>
            )}
            {isISO && <Badge variant="iso">In search of</Badge>}
            {!isAuction && !isISO && Date.now() - new Date(listing.createdAt).getTime() < 24 * 3600 * 1000 && (
              <Badge variant="blue">New · {timeAgo(listing.createdAt)}</Badge>
            )}
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave(listing.id);
            }}
            className={cn(
              "absolute top-3 right-3 h-9 w-9 rounded-full grid place-items-center transition-colors backdrop-blur",
              listing.isSaved
                ? "bg-white/95 text-danger"
                : "bg-white/80 text-ink-soft hover:text-danger",
            )}
            aria-label={listing.isSaved ? "Unsave" : "Save"}
            data-testid={`save-${listing.id}`}
          >
            <Heart size={16} fill={listing.isSaved ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="p-4 space-y-1.5">
          <h3
            className="text-[15px] font-semibold leading-snug line-clamp-2 group-hover:text-blue-ink transition-colors"
            data-testid="listing-title"
          >
            {listing.title}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <div className="text-[16px] font-semibold tracking-[-0.01em] tabular-nums">
              {isISO
                ? "Wanted"
                : isAuction
                  ? formatCents(
                      listing.priceCents ?? listing.auctionStartCents ?? 0,
                      listing.currency,
                    )
                  : formatCents(listing.priceCents, listing.currency)}
            </div>
            {isAuction && (
              <div className="text-[11px] text-muted tabular-nums">{listing.bidCount} bids</div>
            )}
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted pt-0.5">
            <span className="truncate">
              {listing.seller.displayName ?? "Member"}
            </span>
            <span className="w-1 h-1 rounded-full bg-current opacity-40 flex-none" />
            <span className="flex-none">{timeAgo(listing.createdAt)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
