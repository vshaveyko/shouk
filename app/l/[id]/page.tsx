import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { ListingClient } from "./ListingClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: listing?.title ?? "Listing" };
}

export default async function ListingPage({ params }: { params: { id: string } }) {
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

      <main className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="mb-5">
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
