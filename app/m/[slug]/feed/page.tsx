import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { FeedClient } from "./FeedClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  return { title: mp ? `${mp.name} · Feed` : "Feed" };
}

export default async function FeedPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { q?: string; type?: string; sort?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=/m/${params.slug}/feed`);

  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    include: { _count: { select: { memberships: true, listings: true } } },
  });
  if (!mp) redirect("/explore");

  const membership = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
  });

  if (!membership || membership.status !== "ACTIVE") {
    redirect(`/m/${mp.slug}`);
  }

  const q = (searchParams?.q ?? "").trim();
  const type = (searchParams?.type ?? "").toUpperCase();
  const sort = searchParams?.sort ?? "new";

  const listings = await prisma.listing.findMany({
    where: {
      marketplaceId: mp.id,
      status: "ACTIVE",
      ...(type && ["FIXED", "AUCTION", "ISO"].includes(type)
        ? { type: type as "FIXED" | "AUCTION" | "ISO" }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy:
      sort === "price-asc"
        ? { priceCents: "asc" }
        : sort === "price-desc"
          ? { priceCents: "desc" }
          : sort === "ending"
            ? { auctionEndsAt: "asc" }
            : { createdAt: "desc" },
    include: {
      seller: { select: { id: true, displayName: true, image: true } },
      _count: { select: { bids: true, saves: true } },
    },
    take: 60,
  });

  const savedByMe = await prisma.listingSave.findMany({
    where: { userId: session.user.id, marketplaceId: mp.id },
    select: { listingId: true },
  });
  const savedSet = new Set(savedByMe.map((s) => s.listingId));

  const ctx = await getUserContext();
  const unread = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  const initialListings = listings.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type,
    status: l.status,
    images: l.images,
    priceCents: l.priceCents,
    currency: l.currency ?? "USD",
    createdAt: l.createdAt.toISOString(),
    auctionEndsAt: l.auctionEndsAt ? l.auctionEndsAt.toISOString() : null,
    auctionStartCents: l.auctionStartCents,
    seller: l.seller,
    bidCount: l._count.bids,
    saveCount: l._count.saves,
    isSaved: savedSet.has(l.id),
  }));

  return (
    <div className="min-h-screen bg-bg-soft">
      <Navbar
        user={{
          id: session.user.id,
          name: ctx?.user.displayName ?? session.user.name,
          image: ctx?.user.image ?? session.user.image,
          email: session.user.email,
        }}
        activeMarketplace={{
          id: mp.id,
          name: mp.name,
          slug: mp.slug,
          logoUrl: mp.logoUrl,
          primaryColor: mp.primaryColor,
        }}
        marketplaces={ctx ? [...ctx.owned, ...ctx.memberships] : []}
        notificationCount={unread}
      />

      {/* Marketplace hero (design Flow 6/6B) */}
      <div
        style={{
          position: "relative",
          height: 200,
          overflow: "hidden",
          borderBottom: "1px solid var(--line)",
          background: mp.coverImageUrl
            ? `url(${mp.coverImageUrl}) center/cover`
            : `linear-gradient(135deg, ${mp.primaryColor ?? "oklch(0.48 0.2 28)"}, color-mix(in oklab, ${mp.primaryColor ?? "oklch(0.48 0.2 28)"} 50%, black))`,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.25) 40%, transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 28,
            right: 28,
            zIndex: 2,
            color: "#fff",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
            <span
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
                color: mp.primaryColor ?? "oklch(0.48 0.2 28)",
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.4)",
                overflow: "hidden",
              }}
            >
              {mp.logoUrl ? (
                <img src={mp.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                mp.name[0]
              )}
            </span>
            <div>
              <h1
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontWeight: 400,
                  fontSize: 30,
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                {mp.name}
              </h1>
              <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4 }}>
                {mp.category}
                {mp.tagline ? ` · ${mp.tagline}` : ""}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 18, fontSize: 12, opacity: 0.9 }}>
            <span>{mp._count.memberships} members</span>
            <span>·</span>
            <span>{mp._count.listings} listings</span>
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-6 py-8">
        <FeedClient
          slug={mp.slug}
          marketplaceName={mp.name}
          auctionsEnabled={mp.auctionsEnabled}
          initialListings={initialListings}
          initialQuery={q}
          initialType={type}
          initialSort={sort}
        />
      </main>
    </div>
  );
}
