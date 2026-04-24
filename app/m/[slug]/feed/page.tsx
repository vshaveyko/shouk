import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { countUnreadThreads } from "@/lib/messages";
import { FeedClient } from "./FeedClient";

export const dynamic = "force-dynamic";

// Design source: design_handoff_shouks_mvp/Flow 6 - Core App Shell.html  · screen 6B.
// The shared shell styles live on the client; page.tsx owns the .mp-hero +
// owner manage-drawer + .mp-tabs scaffold, and FeedClient owns the browse
// panel (toolbar + active chips + grid).
const mpShellCss = `
.mp-hero { position: relative; height: 200px; overflow: hidden; border-bottom: 1px solid var(--line); background-size: cover; background-position: center; }
.mp-hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.25) 40%, transparent); }
.mp-hero .hero-inner { position: absolute; bottom: 18px; left: 28px; right: 28px; z-index: 2; color: #fff; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; max-width: 1440px; margin: 0 auto; }
.mp-hero .title-wrap { display: flex; align-items: flex-end; gap: 16px; }
.mp-hero .logo { width: 56px; height: 56px; border-radius: 12px; background: #fff; display: grid; place-items: center; font-size: 28px; border: 1px solid rgba(255,255,255,0.4); overflow: hidden; color: var(--ink); font-weight: 600; }
.mp-hero .logo img { width: 100%; height: 100%; object-fit: cover; }
.mp-hero h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 30px; margin: 0; letter-spacing: -0.01em; color: #fff; }
.mp-hero .cat { font-size: 12.5px; opacity: 0.85; margin-top: 4px; }
.mp-hero .hero-stats { display: flex; gap: 18px; font-size: 12px; opacity: 0.9; margin-top: 8px; }
.mp-hero .hero-stats span { display: inline-flex; align-items: center; gap: 6px; }
.mp-hero .hero-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.mp-hero .hero-actions .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 9px; font-size: 13px; font-weight: 500; text-decoration: none; border: 0; cursor: pointer; }
.mp-hero .hero-actions .btn svg { width: 14px; height: 14px; }
.mp-hero .hero-actions .btn-primary { background: #fff; color: var(--ink); }
.mp-hero .hero-actions .btn-primary:hover { background: oklch(0.95 0.004 240); }
.mp-hero .hero-actions .btn-ghost { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); }
.mp-hero .hero-actions .btn-ghost:hover { background: rgba(255,255,255,0.22); }

.mp-tabs { display: flex; gap: 4px; padding: 0 24px; border-bottom: 1px solid var(--line); background: #fff; align-items: flex-end; overflow-x: auto; scrollbar-width: none; }
.mp-tabs::-webkit-scrollbar { display: none; }
.mp-tabs button, .mp-tabs a { padding: 14px 16px 12px; font-size: 13px; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; margin-bottom: -1px; display: inline-flex; align-items: center; gap: 7px; letter-spacing: -0.005em; white-space: nowrap; background: transparent; border-top: 0; border-left: 0; border-right: 0; cursor: pointer; text-decoration: none; }
.mp-tabs button svg, .mp-tabs a svg { width: 14px; height: 14px; }
.mp-tabs button .ct, .mp-tabs a .ct { font-size: 11px; font-weight: 600; color: var(--muted); background: var(--bg-soft); padding: 2px 6px; border-radius: 4px; }
.mp-tabs button.active, .mp-tabs a.active { color: var(--ink); border-bottom-color: var(--ink); font-weight: 600; }
.mp-tabs button.active .ct, .mp-tabs a.active .ct { color: var(--ink); background: oklch(0.93 0.01 240); }
.mp-tabs .tab-spacer { flex: 1; }
.mp-tabs .tab-action { padding: 10px 0; color: var(--muted); font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
.mp-tabs .tab-action:hover { color: var(--ink); }

.manage-drawer { padding: 10px 24px 0; max-width: 1440px; margin: 0 auto; }
.manage-card { background: oklch(0.99 0.004 75 / 0.6); border: 1px solid oklch(0.85 0.08 75); border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.manage-card .m-ic { width: 30px; height: 30px; border-radius: 8px; background: var(--amber, oklch(0.72 0.13 70)); color: #fff; display: grid; place-items: center; flex: none; }
.manage-card .m-ic svg { width: 15px; height: 15px; }
.manage-card .m-body { flex: 1; min-width: 200px; }
.manage-card .m-body .t { font-size: 13px; font-weight: 600; }
.manage-card .m-body .s { font-size: 11.5px; color: var(--ink-soft); }
.manage-card .m-actions { display: flex; gap: 6px; }
.manage-card .m-actions .btn { height: 30px; font-size: 12px; padding: 0 11px; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; border: 0; font-weight: 500; }
.manage-card .m-actions .btn-outline { background: #fff; border: 1px solid var(--line); color: var(--ink); }
.manage-card .m-actions .btn-outline:hover { background: var(--bg-soft); }
.manage-card .m-actions .btn-dark { background: var(--ink); color: #fff; }
.manage-card .m-actions .btn-dark:hover { background: oklch(0.24 0.03 240); }
`;

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
    include: {
      _count: { select: { memberships: true, listings: true } },
      owner: { select: { id: true, displayName: true, name: true } },
    },
  });
  if (!mp) redirect("/explore");

  const membership = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
  });

  if (!membership || membership.status !== "ACTIVE") {
    redirect(`/m/${mp.slug}`);
  }

  const isOwner = mp.ownerId === session.user.id;
  const isAdmin = membership.role === "ADMIN" || membership.role === "MODERATOR" || isOwner;

  const q = (searchParams?.q ?? "").trim();
  const type = (searchParams?.type ?? "").toUpperCase();
  const sort = searchParams?.sort ?? "new";

  const [listings, savedByMe, myListingsCount, pendingApps, unresolvedReports, ctx, unread, unreadMessages] =
    await Promise.all([
      prisma.listing.findMany({
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
      }),
      prisma.listingSave.findMany({
        where: { userId: session.user.id, marketplaceId: mp.id },
        select: { listingId: true },
      }),
      prisma.listing.count({
        where: { marketplaceId: mp.id, sellerId: session.user.id, status: "ACTIVE" },
      }),
      isAdmin
        ? prisma.application.count({ where: { marketplaceId: mp.id, status: "PENDING" } })
        : Promise.resolve(0),
      isAdmin
        ? prisma.report.count({
            where: { listing: { marketplaceId: mp.id }, resolved: false },
          })
        : Promise.resolve(0),
      getUserContext(),
      prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
      countUnreadThreads(session.user.id),
    ]);

  const savedSet = new Set(savedByMe.map((s) => s.listingId));

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

  const ownerName = mp.owner.displayName ?? mp.owner.name ?? "Owner";
  const heroBg = mp.coverImageUrl
    ? `url(${mp.coverImageUrl})`
    : `linear-gradient(135deg, ${mp.primaryColor ?? "oklch(0.48 0.2 28)"}, color-mix(in oklab, ${mp.primaryColor ?? "oklch(0.48 0.2 28)"} 40%, black))`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-soft)" }}>
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
        unreadMessagesCount={unreadMessages}
      />
      <style dangerouslySetInnerHTML={{ __html: mpShellCss }} />

      <div className="mp-hero" style={{ background: heroBg, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="hero-inner">
          <div className="title-wrap">
            <div className="logo" style={{ color: mp.primaryColor ?? "var(--ink)" }}>
              {mp.logoUrl ? <img src={mp.logoUrl} alt="" /> : mp.name[0]}
            </div>
            <div>
              <h1>{mp.name}</h1>
              <div className="cat">
                {mp.category}
                {mp.tagline ? ` · ${mp.tagline}` : ""}
                {ownerName ? ` · Founded by ${ownerName}` : ""}
                {mp._count.memberships > 0 ? ` · ${mp._count.memberships.toLocaleString()} members` : ""}
              </div>
              <div className="hero-stats">
                <span>🏷 {mp._count.listings.toLocaleString()} active listings</span>
              </div>
            </div>
          </div>
          <div className="hero-actions">
            <Link href={`/m/${mp.slug}/new`} className="btn btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Post a listing
            </Link>
            <Link href="/activity" className="btn btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              Alerts
            </Link>
          </div>
        </div>
      </div>

      {isAdmin && (pendingApps > 0 || unresolvedReports > 0) && (
        <div className="manage-drawer">
          <div className="manage-card">
            <div className="m-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
            <div className="m-body">
              <div className="t">
                {pendingApps > 0 &&
                  `${pendingApps} join request${pendingApps === 1 ? "" : "s"} waiting`}
                {pendingApps > 0 && unresolvedReports > 0 && " · "}
                {unresolvedReports > 0 &&
                  `${unresolvedReports} listing${unresolvedReports === 1 ? "" : "s"} flagged for review`}
              </div>
              <div className="s">
                You run this marketplace. Only admins see this bar.
              </div>
            </div>
            <div className="m-actions">
              {pendingApps > 0 && (
                <Link href={`/owner/${mp.slug}/applications`} className="btn btn-outline">
                  Review queue
                </Link>
              )}
              <Link href={`/owner/${mp.slug}/dashboard`} className="btn btn-dark">
                Open dashboard →
              </Link>
            </div>
          </div>
        </div>
      )}

      <FeedClient
        slug={mp.slug}
        marketplaceName={mp.name}
        auctionsEnabled={mp.auctionsEnabled}
        primaryColor={mp.primaryColor}
        activeListingCount={mp._count.listings}
        memberCount={mp._count.memberships}
        myListingsCount={myListingsCount}
        initialListings={initialListings}
        initialQuery={q}
        initialType={type}
        initialSort={sort}
      />
    </div>
  );
}
