import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { ListingClient } from "./ListingClient";

export const dynamic = "force-dynamic";

// Design source: design_handoff_shouks_mvp/Flow 6 - Core App Shell.html  · 6C.
// Class names (.ld, .ld-left, .ld-right, .ld-main-img, .ld-thumbs,
// .ld-head, .ld-price, .ld-cta, .ld-spec, .seller-box, .description)
// mirror the design so future visual edits map 1:1.
const ldCss = `
.ld { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 24px; padding: 8px 0 40px; max-width: 1280px; margin: 0 auto; }
@media (max-width: 900px) { .ld { grid-template-columns: 1fr; } }
.ld-left { display: flex; flex-direction: column; gap: 16px; }
.ld-right { display: flex; flex-direction: column; gap: 16px; }
.ld-main-img { position: relative; aspect-ratio: 4 / 3; background: var(--bg-panel); border-radius: 14px; overflow: hidden; }
.ld-main-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ld-thumbs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.ld-thumb { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: var(--bg-panel); border: 2px solid transparent; cursor: pointer; }
.ld-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ld-thumb.on { border-color: var(--ink); }
.ld-thumb:hover:not(.on) { border-color: var(--line); }
.ld-head { padding: 0; }
.ld-head .breadcrumb { font-size: 11.5px; color: var(--muted); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.ld-head .breadcrumb a { color: var(--blue-ink); text-decoration: none; }
.ld-head .breadcrumb a:hover { text-decoration: underline; }
.ld-head h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 30px; letter-spacing: -0.005em; margin: 0 0 8px; line-height: 1.15; }
.ld-head .meta { font-size: 12.5px; color: var(--muted); display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.ld-price { padding: 14px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.ld-price .amt { font-family: "Instrument Serif", serif; font-size: 34px; font-weight: 400; letter-spacing: -0.01em; line-height: 1; }
.ld-price .sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
.ld-cta { display: flex; gap: 10px; flex-wrap: wrap; }
.ld-cta > * { flex: 1; min-width: 140px; }
.ld-spec { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: #fff; }
.ld-spec .sp-row { display: grid; grid-template-columns: 120px 1fr; padding: 10px 14px; border-bottom: 1px solid var(--line-soft); font-size: 13px; gap: 12px; align-items: start; }
.ld-spec .sp-row:last-child { border-bottom: 0; }
.ld-spec .sp-row .k { color: var(--muted); }
.ld-spec .sp-row .v { font-weight: 500; }
.seller-box { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.description { font-size: 13.5px; color: var(--ink-soft); line-height: 1.6; }
.description h4 { font-size: 13px; color: var(--ink); margin: 0 0 8px; font-weight: 600; }
.ld-locked { padding: 10px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg-panel); font-size: 13px; color: var(--ink-soft); display: flex; align-items: center; gap: 8px; }
`;

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: listing?.title ?? "Listing" };
}

export default async function ListingPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      seller: {
        select: {
          id: true,
          displayName: true,
          name: true,
          image: true,
          bio: true,
          verifiedAccounts: { select: { provider: true } },
        },
      },
      marketplace: {
        include: {
          schemaFields: { where: { archived: false }, orderBy: { order: "asc" } },
          _count: { select: { memberships: true, listings: true } },
        },
      },
      bids: {
        orderBy: { amountCents: "desc" },
        take: 20,
        include: { user: { select: { id: true, displayName: true, image: true } } },
      },
      _count: { select: { bids: true, saves: true } },
    },
  });

  if (!listing) notFound();

  const userId = session?.user?.id;
  let isSaved = false;
  if (userId) {
    const s = await prisma.listingSave.findUnique({
      where: { userId_listingId: { userId, listingId: listing.id } },
    });
    isSaved = !!s;
  }

  const isSeller = userId === listing.sellerId;
  const isMarketOwner = userId === listing.marketplace.ownerId;

  const ctx = userId ? await getUserContext() : null;
  const unread = userId
    ? await prisma.notification.count({
        where: { userId: userId, readAt: null },
      })
    : 0;

  const schemaValues = (listing.schemaValues as Record<string, unknown>) ?? {};

  const clientBids = listing.bids.map((b) => ({
    id: b.id,
    amountCents: b.amountCents,
    createdAt: b.createdAt.toISOString(),
    user: b.user,
    isMine: b.userId === userId,
  }));

  const schemaFieldsForClient = listing.marketplace.schemaFields.map((f) => ({
    id: f.id,
    name: f.name,
    label: f.label,
    type: f.type as string,
  }));

  return (
    <div className="min-h-screen bg-bg-soft">
      {userId && ctx ? (
        <Navbar
          user={{
            id: userId,
            name: ctx.user.displayName ?? session?.user?.name,
            image: ctx.user.image ?? session?.user?.image,
            email: session?.user?.email ?? null,
          }}
          activeMarketplace={{
            id: listing.marketplace.id,
            name: listing.marketplace.name,
            slug: listing.marketplace.slug,
            logoUrl: listing.marketplace.logoUrl,
            primaryColor: listing.marketplace.primaryColor,
          }}
          marketplaces={[...ctx.owned, ...ctx.memberships]}
          notificationCount={unread}
        />
      ) : (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-line">
          <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="text-[14px] font-semibold">Shouks</Link>
            <Link href={`/signin?callbackUrl=/l/${listing.id}`} className="text-[13px] text-ink-soft hover:text-ink">Sign in</Link>
          </div>
        </header>
      )}

      <style dangerouslySetInnerHTML={{ __html: ldCss }} />
      <main className="max-w-[1280px] mx-auto px-6 py-6">
        <div className="mb-3">
          <Link
            href={`/m/${listing.marketplace.slug}/feed`}
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={14} /> Back to {listing.marketplace.name}
          </Link>
        </div>

        <ListingClient
          listing={{
            id: listing.id,
            title: listing.title,
            type: listing.type,
            status: listing.status,
            description: listing.description,
            images: listing.images,
            priceCents: listing.priceCents,
            currency: listing.currency ?? "USD",
            createdAt: listing.createdAt.toISOString(),
            soldAt: listing.soldAt ? listing.soldAt.toISOString() : null,
            closedAt: listing.closedAt ? listing.closedAt.toISOString() : null,
            views: listing.views,
            auctionStartCents: listing.auctionStartCents,
            auctionReserveCents: listing.auctionReserveCents,
            auctionMinIncrementCents: listing.auctionMinIncrementCents,
            auctionEndsAt: listing.auctionEndsAt ? listing.auctionEndsAt.toISOString() : null,
            schemaValues,
          }}
          schemaFields={schemaFieldsForClient}
          seller={{
            id: listing.seller.id,
            displayName: listing.seller.displayName ?? listing.seller.name ?? "Member",
            image: listing.seller.image,
            bio: listing.seller.bio,
            verifiedProviders: listing.seller.verifiedAccounts.map((v) => v.provider as string),
          }}
          marketplace={{
            id: listing.marketplace.id,
            slug: listing.marketplace.slug,
            name: listing.marketplace.name,
            antiSnipe: listing.marketplace.antiSnipe,
          }}
          bids={clientBids}
          saveCount={listing._count.saves}
          bidCount={listing._count.bids}
          isSaved={isSaved}
          isSeller={isSeller}
          isMarketOwner={isMarketOwner}
          isAuthed={!!userId}
        />
      </main>
    </div>
  );
}
