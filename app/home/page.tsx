import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { JoinViaWhatsAppButton } from "@/components/whatsapp/JoinViaWhatsAppButton";
import { PostListingButton } from "@/components/app/PostListingButton";
import { RecentlyViewedSection } from "@/components/app/RecentlyViewed";
import { prisma } from "@/lib/prisma";
import { countUnreadThreads } from "@/lib/messages";

export const dynamic = "force-dynamic";

// Design source: design_handoff_shouks_mvp/Flow 6 - Core App Shell.html  · screen 6A.
// Keep classnames identical to the design so future visual edits map 1:1.
const dashCss = `
.dash { padding: 0 0 56px; }
.welcome-strip { background: var(--bg-panel); border-bottom: 1px solid var(--line); padding: 28px 28px 22px; position: relative; }
.welcome-strip::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent 0%, var(--blue) 30%, var(--blue) 70%, transparent 100%); opacity: 0.7; }
.welcome-strip-inner { max-width: 1440px; margin: 0 auto; }
.welcome-strip .section-row { margin-bottom: 14px; }

.dash-body { padding: 24px 28px 0; max-width: 1440px; margin: 0 auto; }

.section-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
.section-row h1 { margin: 0; font-family: "Instrument Serif", serif; font-size: 34px; letter-spacing: -0.01em; font-weight: 400; line-height: 1.1; }
.section-row h2 { margin: 0; font-size: 15px; letter-spacing: -0.01em; font-weight: 600; }
.section-row .kicker { font-size: 12.5px; color: var(--muted); margin-bottom: 4px; }

.dash .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 9px; font-size: 13px; font-weight: 500; border: 0; cursor: pointer; text-decoration: none; }
.dash .btn svg { width: 14px; height: 14px; }
.dash .btn-dark { background: var(--ink); color: #fff; }
.dash .btn-dark:hover { background: oklch(0.24 0.03 240); }
.dash .btn-outline { border: 1px solid var(--line); color: var(--ink); background: #fff; }
.dash .btn-outline:hover { background: var(--hover); }

.mp-filter { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.mp-filter .mp-search { flex: 1; max-width: 360px; height: 36px; background: #fff; border: 1px solid var(--line); border-radius: 9px; display: flex; align-items: center; gap: 8px; padding: 0 12px; font-size: 13px; color: var(--muted); text-decoration: none; }
.mp-filter .mp-search svg { width: 14px; height: 14px; }
.mp-filter .mp-search:focus-within, .mp-filter .mp-search:hover { border-color: var(--blue); box-shadow: 0 0 0 3px var(--blue-soft); }
.mp-filter .scope { display: inline-flex; gap: 4px; padding: 3px; background: #fff; border: 1px solid var(--line); border-radius: 9px; }
.mp-filter .scope a { padding: 6px 12px; font-size: 12px; border-radius: 6px; color: var(--ink-soft); display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
.mp-filter .scope a .n { font-family: ui-monospace, monospace; font-size: 10.5px; color: var(--muted); font-weight: 500; }
.mp-filter .scope a.on { background: var(--ink); color: #fff; font-weight: 500; }
.mp-filter .scope a.on .n { color: oklch(1 0 0 / 0.65); }

.mp-row { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin; }
.mp-row::-webkit-scrollbar { height: 6px; }
.mp-row::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }
.mp-chip { flex: none; width: 240px; height: 86px; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; display: flex; gap: 10px; align-items: center; position: relative; cursor: pointer; transition: border-color 140ms, transform 140ms; color: inherit; text-decoration: none; }
.mp-chip:hover { border-color: oklch(0.82 0.004 60); }
.mp-chip.favorited { border-color: var(--blue); box-shadow: inset 3px 0 0 var(--blue); }
.mp-chip .mp-thumb { width: 56px; height: 56px; border-radius: 10px; flex: none; position: relative; overflow: hidden; display: grid; place-items: center; color: #fff; font-size: 18px; font-weight: 600; }
.mp-chip .mp-thumb::after { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.2)); pointer-events: none; }
.mp-chip .mp-meta { min-width: 0; flex: 1; }
.mp-chip .mp-meta .n { font-size: 13.5px; font-weight: 600; letter-spacing: -0.005em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-chip .mp-meta .c { font-size: 11.5px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-chip .mp-meta .tags { display: flex; gap: 4px; margin-top: 5px; flex-wrap: wrap; }
.role-pill { font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
.role-pill.owner { background: var(--ink); color: #fff; }
.role-pill.member { background: var(--bg-panel); color: var(--ink-soft); }
.count-pill { font-size: 9.5px; font-weight: 700; background: var(--ink); color: #fff; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.02em; }
.mp-chip.new-mp { border-style: dashed; background: transparent; justify-content: center; color: var(--muted); font-size: 13px; font-weight: 500; width: 180px; }
.mp-chip.new-mp:hover { border-color: var(--ink); color: var(--ink); background: #fff; }
.mp-chip.new-mp .plus-ic { width: 28px; height: 28px; border-radius: 7px; background: var(--bg-soft); display: grid; place-items: center; }
.mp-chip.new-mp .plus-ic svg { width: 14px; height: 14px; }

.dash-two { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 24px; }
@media (max-width: 1100px) { .dash-two { grid-template-columns: minmax(0, 1fr) 260px; } }
@media (max-width: 960px) { .dash-two { grid-template-columns: 1fr; } }

.feed { display: flex; flex-direction: column; }
.feed-head { display: flex; align-items: center; justify-content: space-between; padding: 4px 0 14px; gap: 16px; flex-wrap: wrap; }
.feed-head h2 { margin: 0; font-size: 17px; letter-spacing: -0.015em; font-weight: 600; }
.feed-head .scope { display: inline-flex; gap: 4px; padding: 3px; background: #fff; border: 1px solid var(--line); border-radius: 8px; }
.feed-head .scope button { padding: 5px 10px; font-size: 11.5px; border-radius: 6px; color: var(--ink-soft); background: transparent; border: 0; cursor: pointer; }
.feed-head .scope button.on { background: var(--ink); color: #fff; font-weight: 500; }

.feed-item { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 12px; display: flex; gap: 14px; margin-bottom: 10px; cursor: pointer; transition: border-color 140ms; color: inherit; text-decoration: none; }
.feed-item:hover { border-color: oklch(0.85 0.01 240); }
.feed-item .fi-img { width: 90px; height: 90px; border-radius: 10px; flex: none; position: relative; overflow: hidden; background-size: cover; background-position: center; }
.feed-item .fi-img .chip { position: absolute; bottom: 5px; left: 5px; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.92); color: var(--ink); }
.feed-item .fi-img .chip.auction { background: var(--ink); color: #fff; }
.feed-item .fi-iso { width: 90px; height: 90px; border-radius: 10px; flex: none; background: linear-gradient(135deg, oklch(0.94 0.04 85), oklch(0.85 0.1 75)); display: grid; place-items: center; color: oklch(0.45 0.12 65); font-size: 26px; font-weight: 400; font-family: "Instrument Serif", serif; }
.feed-item .fi-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; }
.feed-item .fi-top { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
.feed-item .fi-mp { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-soft); display: inline-flex; align-items: center; gap: 6px; }
.feed-item .fi-mp .dot { width: 5px; height: 5px; border-radius: 50%; }
.feed-item .fi-title { font-size: 14.5px; font-weight: 500; letter-spacing: -0.01em; margin-top: 4px; line-height: 1.35; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.feed-item .fi-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; gap: 10px; flex-wrap: wrap; }
.feed-item .fi-price { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }
.feed-item .fi-iso-price { font-size: 13px; font-weight: 500; color: var(--ink-soft); }
.feed-item .fi-meta { font-size: 11.5px; color: var(--muted); display: inline-flex; align-items: center; gap: 10px; }
.feed-item .fi-tag { font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 5px; letter-spacing: 0.02em; }
.fi-tag.new { background: var(--bg-panel); color: var(--ink); }
.fi-tag.match { background: var(--blue-soft); color: var(--blue-ink); }
.fi-tag.ending { background: var(--blue); color: #fff; }

.feed-empty { background: #fff; border: 1px dashed var(--line); border-radius: 12px; padding: 40px 24px; text-align: center; color: var(--muted); font-size: 13px; }
.feed-empty strong { display: block; color: var(--ink); font-weight: 600; font-size: 14.5px; margin-bottom: 4px; }
.feed-empty-actions { margin-top: 14px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }

.side-stack { display: flex; flex-direction: column; gap: 14px; }
.side-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; position: relative; overflow: hidden; }
.side-card::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--ink); }
.side-card.saved::before { background: var(--blue); }
.side-card.mine::before { background: var(--ink); }
.side-card .sc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.side-card .sc-head h3 { margin: 0; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 7px; color: var(--ink); }
.side-card .sc-head h3 svg { width: 13px; height: 13px; color: var(--ink); }
.side-card.saved .sc-head h3 svg { color: var(--blue-ink); }
.side-card .sc-head a { font-size: 11.5px; color: var(--blue-ink); font-weight: 500; text-decoration: none; }
.side-card .empty-mini { font-size: 11.5px; color: var(--muted); padding: 6px 0 2px; }

.rv-item { display: flex; gap: 10px; padding: 8px 0; border-top: 1px solid var(--line-soft); align-items: center; cursor: pointer; color: inherit; text-decoration: none; }
.rv-item:first-of-type { border-top: 0; padding-top: 4px; }
.rv-item .rv-img { width: 40px; height: 40px; border-radius: 8px; flex: none; background-size: cover; background-position: center; }
.rv-item .rv-meta { flex: 1; min-width: 0; }
.rv-item .rv-title { font-size: 12.5px; font-weight: 500; letter-spacing: -0.005em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rv-item .rv-sub { font-size: 10.5px; color: var(--muted); display: flex; gap: 6px; }
.rv-item .rv-price { font-size: 12px; font-weight: 600; letter-spacing: -0.005em; }

.mine-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; padding: 10px; background: var(--bg-soft); border-radius: 8px; margin-bottom: 10px; }
.mine-stats > div { text-align: center; position: relative; }
.mine-stats > div + div::before { content: ""; position: absolute; left: 0; top: 6px; bottom: 6px; width: 1px; background: var(--line); }
.mine-stats .v { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; }
.mine-stats span { font-size: 10px; color: var(--muted); letter-spacing: 0.02em; }
.mine-row { display: flex; gap: 10px; padding: 8px 0; border-top: 1px solid var(--line-soft); align-items: center; cursor: pointer; color: inherit; text-decoration: none; }
.mine-row:first-of-type { border-top: 0; padding-top: 4px; }
.mine-row .rv-img { width: 40px; height: 40px; border-radius: 8px; flex: none; background-size: cover; background-position: center; }
.mine-row .rv-meta { flex: 1; min-width: 0; }
.mine-row .rv-title { font-size: 12.5px; font-weight: 500; letter-spacing: -0.005em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mine-row .rv-sub { font-size: 10.5px; color: var(--muted); display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
.mp-pill { display: inline-block; font-size: 9.5px; font-weight: 600; letter-spacing: 0.02em; padding: 2px 6px; border-radius: 4px; background: var(--bg-panel); color: var(--ink-soft); }
.offer-chip { font-size: 10px; font-weight: 600; padding: 3px 7px; border-radius: 5px; background: var(--blue); color: #fff; }
`;

type ScopeValue = "all" | "owner" | "member";

export default async function HomeDashboard(
  props: {
    searchParams?: Promise<{ stay?: string; scope?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/home");
  const { user, memberships, owned } = ctx;

  // When a user owns or belongs to multiple marketplaces there's no
  // sensible "default" to drop them into, and picking owned[0] made the
  // whole app feel tailored to the first marketplace they created
  // (SHK-037). Only auto-redirect an OWNER with exactly one owned
  // marketplace and zero member marketplaces — the unambiguous case.
  // `?stay=1` always opts out (SHK-028 brand-logo loop).
  if (
    searchParams?.stay !== "1" &&
    user.defaultRole === "OWNER" &&
    owned.length === 1 &&
    memberships.length === 0
  ) {
    redirect(`/owner/${owned[0].slug}/dashboard`);
  }

  const scope: ScopeValue = ["owner", "member"].includes(searchParams?.scope ?? "")
    ? (searchParams!.scope as ScopeValue)
    : "all";

  const ownedIds = owned.map((m) => m.id);
  const memberIds = memberships.map((m) => m.id);
  const allMarketplaceIds = [...ownedIds, ...memberIds];

  const visibleMarketplaces =
    scope === "owner"
      ? owned.map((m) => ({ ...m, role: "owner" as const }))
      : scope === "member"
        ? memberships.map((m) => ({ ...m, role: "member" as const }))
        : [
            ...owned.map((m) => ({ ...m, role: "owner" as const })),
            ...memberships.map((m) => ({ ...m, role: "member" as const })),
          ];

  const [
    unread,
    unreadMessages,
    feed,
    myListings,
    mySaved,
    myActiveCount,
    myOfferCount,
    viewAgg,
  ] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    countUnreadThreads(user.id),
    allMarketplaceIds.length > 0
      ? prisma.listing.findMany({
          where: { marketplaceId: { in: allMarketplaceIds }, status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            marketplace: { select: { name: true, slug: true, primaryColor: true } },
            _count: { select: { bids: true } },
          },
        })
      : Promise.resolve([]),
    prisma.listing.findMany({
      where: { sellerId: user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        marketplace: { select: { name: true, slug: true, primaryColor: true } },
        _count: { select: { bids: true } },
      },
    }),
    prisma.listingSave.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        listing: {
          include: {
            marketplace: { select: { name: true, slug: true, primaryColor: true } },
          },
        },
      },
    }),
    prisma.listing.count({ where: { sellerId: user.id, status: { notIn: ["DRAFT", "REMOVED", "SHADOW_HIDDEN"] } } }),
    prisma.bid.count({
      where: {
        userId: { not: user.id },
        listing: { sellerId: user.id, status: "ACTIVE" },
      },
    }),
    prisma.listing.aggregate({
      where: { sellerId: user.id, status: "ACTIVE" },
      _sum: { views: true },
    }),
  ]);

  const myViewsTotal = viewAgg._sum.views ?? 0;

  const scopeCounts = {
    all: owned.length + memberships.length,
    owner: owned.length,
    member: memberships.length,
  };

  const firstName =
    user.displayName?.split(" ")[0] ?? user.name?.split(" ")[0] ?? "there";

  const hasAnyMarketplace = owned.length + memberships.length > 0;
  const firstMarketplaceSlug = owned[0]?.slug ?? memberships[0]?.slug;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-soft)" }}>
      <Navbar
        user={{
          id: user.id,
          name: user.displayName ?? user.name,
          image: user.image,
          email: user.email,
        }}
        activeMarketplace={null}
        marketplaces={[...owned, ...memberships]}
        mode="member"
        notificationCount={unread}
        unreadMessagesCount={unreadMessages}
      />
      <style dangerouslySetInnerHTML={{ __html: dashCss }} />

      <div className="dash">
        <div className="welcome-strip">
          <div className="welcome-strip-inner">
            <div className="section-row">
              <div>
                <div className="kicker">Welcome back, {firstName}</div>
                <h1>Your marketplaces</h1>
              </div>
              <div style={{ display: "inline-flex", gap: 8 }}>
                <JoinViaWhatsAppButton
                  enabled={process.env.WHATSAPP_ENABLED === "true"}
                  className="btn btn-outline"
                />
                <Link href="/owner/create" className="btn btn-dark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Create a marketplace
                </Link>
              </div>
            </div>

            <div className="mp-filter">
              <Link href="/search" className="mp-search" data-testid="dash-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                Search marketplaces by name
              </Link>
              <div className="scope" role="tablist" aria-label="Filter marketplaces">
                <Link href="/home?stay=1" className={scope === "all" ? "on" : ""} data-testid="scope-all">
                  All <span className="n">{scopeCounts.all}</span>
                </Link>
                <Link href="/home?stay=1&scope=owner" className={scope === "owner" ? "on" : ""} data-testid="scope-owner">
                  Owner <span className="n">{scopeCounts.owner}</span>
                </Link>
                <Link href="/home?stay=1&scope=member" className={scope === "member" ? "on" : ""} data-testid="scope-member">
                  Member <span className="n">{scopeCounts.member}</span>
                </Link>
              </div>
            </div>

            <div className="mp-row">
              {visibleMarketplaces.map((m, idx) => {
                const isOwner = m.role === "owner";
                const color = m.primaryColor ?? "oklch(0.55 0.17 25)";
                const favorited = idx === 0;
                return (
                  <Link
                    key={m.id}
                    href={`/m/${m.slug}`}
                    className={`mp-chip${favorited ? " favorited" : ""}`}
                    data-testid={`marketplace-chip-${m.slug}`}
                  >
                    <span
                      className="mp-thumb"
                      style={{
                        background: m.logoUrl
                          ? `url(${m.logoUrl}) center/cover`
                          : `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 50%, black))`,
                      }}
                    >
                      {!m.logoUrl && m.name[0]}
                    </span>
                    <div className="mp-meta">
                      <div className="n">{m.name}</div>
                      <div className="c">{m.category}</div>
                      <div className="tags">
                        <span className={`role-pill ${isOwner ? "owner" : "member"}`}>
                          {isOwner ? "Owner" : "Member"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              <Link href="/explore" className="mp-chip new-mp">
                <span className="plus-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                Discover more
              </Link>
            </div>
          </div>
        </div>

        <div className="dash-body">
          <div className="dash-two">
            <div className="feed">
              <div className="feed-head">
                <h2>New in your marketplaces</h2>
                <div className="scope" role="tablist" aria-label="Feed scope">
                  <button type="button" className="on">All</button>
                  <button type="button">Favorites</button>
                  <button type="button">Matching alerts</button>
                </div>
              </div>

              {feed.length === 0 ? (
                <div className="feed-empty">
                  <strong>
                    {hasAnyMarketplace ? "Nothing new yet." : "You haven't joined a marketplace yet."}
                  </strong>
                  {hasAnyMarketplace
                    ? "New listings and drops from your marketplaces will show up here."
                    : "Find a community that fits you — or stand up your own."}
                  <div className="feed-empty-actions">
                    <Link href="/explore" className="btn btn-dark">Explore marketplaces</Link>
                    {!hasAnyMarketplace && <Link href="/owner/create" className="btn btn-outline">Create one</Link>}
                  </div>
                </div>
              ) : (
                <>
                  {feed.map((l) => {
                    const color = l.marketplace.primaryColor ?? "oklch(0.55 0.17 25)";
                    const cover = l.images[0];
                    const isIso = l.type === "ISO";
                    const isAuction = l.type === "AUCTION";
                    const hoursOld = (Date.now() - l.createdAt.getTime()) / (1000 * 60 * 60);
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
                              {isAuction && l._count.bids > 0 && <span>{l._count.bids} bids</span>}
                              <span>Posted {postedLabel}</span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {hasAnyMarketplace && (
                    <div style={{ textAlign: "center", marginTop: 8 }}>
                      <Link href="/explore" className="btn btn-outline" style={{ height: 34 }}>
                        Show more →
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            <aside className="side-stack">
              <div className="side-card mine" data-testid="your-listings-card">
                <div className="sc-head">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                    </svg>
                    Your listings
                  </h3>
                  {myActiveCount > 0 && <Link href="/activity">Manage all</Link>}
                </div>
                <div className="mine-stats">
                  <div>
                    <div className="v">{myActiveCount}</div>
                    <span>Active</span>
                  </div>
                  <div>
                    <div className="v">{myOfferCount}</div>
                    <span>Offers</span>
                  </div>
                  <div>
                    <div className="v">{myViewsTotal}</div>
                    <span>Views</span>
                  </div>
                </div>
                {myListings.length === 0 ? (
                  <div className="empty-mini">
                    You haven't posted anything yet. Your active listings and offers will show up here.
                  </div>
                ) : (
                  myListings.map((l) => {
                    const color = l.marketplace.primaryColor ?? "oklch(0.55 0.17 25)";
                    const cover = l.images[0];
                    const bids = l._count.bids;
                    return (
                      <Link key={l.id} href={`/l/${l.id}`} className="mine-row" data-testid="mine-row">
                        <div
                          className="rv-img"
                          style={{
                            background: cover
                              ? `url(${cover}) center/cover`
                              : `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 50%, black))`,
                          }}
                        />
                        <div className="rv-meta">
                          <div className="rv-title">{l.title}</div>
                          <div className="rv-sub">
                            <span className="mp-pill">{l.marketplace.name}</span>
                            <span>· {formatMoneyFull(l.priceCents ?? l.auctionStartCents ?? 0)}</span>
                          </div>
                        </div>
                        {bids > 0 && (
                          <span className="offer-chip">
                            {bids} {bids === 1 ? "offer" : "offers"}
                          </span>
                        )}
                      </Link>
                    );
                  })
                )}
                <PostListingButton
                  marketplaces={[...owned, ...memberships].map((m) => ({
                    id: m.id,
                    name: m.name,
                    slug: m.slug,
                    logoUrl: m.logoUrl,
                    primaryColor: m.primaryColor,
                  }))}
                />
              </div>

              <div className="side-card saved" data-testid="saved-listings-card">
                <div className="sc-head">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    Saved listings
                  </h3>
                  {mySaved.length > 0 && <Link href="/activity?tab=saved">See all</Link>}
                </div>
                {mySaved.length === 0 ? (
                  <div className="empty-mini">
                    Nothing saved yet. Tap the bookmark on any listing to keep tabs on it.
                  </div>
                ) : (
                  mySaved.map((s) => {
                    const l = s.listing;
                    const color = l.marketplace.primaryColor ?? "oklch(0.55 0.17 25)";
                    const cover = l.images[0];
                    const price = l.priceCents ?? l.auctionStartCents ?? 0;
                    return (
                      <Link key={s.id} href={`/l/${l.id}`} className="rv-item" data-testid="saved-row">
                        <div
                          className="rv-img"
                          style={{
                            background: cover
                              ? `url(${cover}) center/cover`
                              : `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 50%, black))`,
                          }}
                        />
                        <div className="rv-meta">
                          <div className="rv-title">{l.title}</div>
                          <div className="rv-sub">
                            <span>{l.marketplace.name}</span>
                            <span>· Saved {shortAgo(s.createdAt)}</span>
                          </div>
                        </div>
                        <div className="rv-price">{formatMoneyFull(price)}</div>
                      </Link>
                    );
                  })
                )}
              </div>
            </aside>
          </div>
        </div>
        <div className="px-6 pb-10 max-w-[1440px] mx-auto">
          <RecentlyViewedSection />
        </div>
      </div>
    </div>
  );
}

function formatMoney(cents: number) {
  const v = cents / 100;
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatMoneyShort(cents: number) {
  const v = cents / 100;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return `$${Math.round(v).toLocaleString()}`;
}

// SHK-048: in side cards (My listings, Saved listings) show the actual
// price down to the cent rather than rounding/abbreviating.
function formatMoneyFull(cents: number) {
  const hasCents = cents % 100 !== 0;
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  })}`;
}

function timeUntilShort(to: Date) {
  const ms = to.getTime() - Date.now();
  if (ms <= 0) return "ended";
  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function shortAgo(d: Date) {
  const ms = Date.now() - d.getTime();
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}
