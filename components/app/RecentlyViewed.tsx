"use client";

import * as React from "react";
import Link from "next/link";
import { formatCents } from "@/lib/utils";

type RecentListing = {
  id: string;
  title: string;
  priceCents: number | null;
  currency: string;
  image: string | null;
  viewedAt: number;
};

const STORAGE_KEY = "shouks_recently_viewed";
const MAX_ITEMS = 6;

export function useRecentlyViewed() {
  function get(): RecentListing[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      return [];
    }
  }

  function add(item: Omit<RecentListing, "viewedAt">) {
    const current = get().filter((l) => l.id !== item.id);
    const next: RecentListing[] = [{ ...item, viewedAt: Date.now() }, ...current].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return { get, add };
}

export function TrackListingView({
  id,
  title,
  priceCents,
  currency,
  image,
}: {
  id: string;
  title: string;
  priceCents: number | null;
  currency: string;
  image: string | null;
}) {
  const { add } = useRecentlyViewed();
  React.useEffect(() => {
    add({ id, title, priceCents, currency, image });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function RecentlyViewedSection() {
  const [listings, setListings] = React.useState<RecentListing[]>([]);
  const { get } = useRecentlyViewed();

  React.useEffect(() => {
    setListings(get());
  }, []);

  if (listings.length === 0) return null;

  return (
    <section className="mt-8" data-testid="recently-viewed">
      <h2 className="text-[15px] font-semibold mb-3">Recently viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {listings.map((l) => (
          <Link
            key={l.id}
            href={`/l/${l.id}`}
            className="block rounded-[10px] border border-line bg-surface overflow-hidden hover:shadow-sm transition-shadow"
          >
            <div className="aspect-square bg-bg-panel relative overflow-hidden">
              {l.image ? (
                <img src={l.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-muted text-[11px]">No image</div>
              )}
            </div>
            <div className="p-2">
              <p className="text-[12px] font-medium line-clamp-2 leading-[1.4]">{l.title}</p>
              {l.priceCents != null && (
                <p className="text-[11px] text-ink-soft mt-0.5">{formatCents(l.priceCents, l.currency)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
