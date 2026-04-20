import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({ amountCents: z.number().int().min(1) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid bid" }, { status: 400 });

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { bids: { orderBy: { amountCents: "desc" }, take: 1 }, marketplace: true },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.type !== "AUCTION") return NextResponse.json({ error: "Not an auction" }, { status: 400 });
  if (listing.status !== "ACTIVE") return NextResponse.json({ error: "Auction is not active" }, { status: 400 });
  if (listing.auctionEndsAt && listing.auctionEndsAt < new Date()) {
    return NextResponse.json({ error: "Auction has ended" }, { status: 400 });
  }
  if (listing.sellerId === session.user.id) {
    return NextResponse.json({ error: "You can't bid on your own auction." }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: listing.marketplaceId } },
  });
  if (!membership || membership.status !== "ACTIVE") {
    return NextResponse.json({ error: "You must be a member to bid." }, { status: 403 });
  }

  const currentHigh = listing.bids[0]?.amountCents ?? (listing.auctionStartCents ?? 0);
  const increment = listing.auctionMinIncrementCents ?? 100;
  const minAcceptable = currentHigh + increment;

  if (parsed.data.amountCents < minAcceptable) {
    return NextResponse.json({ error: `Bid must be at least ${minAcceptable / 100}` }, { status: 400 });
  }

  const bid = await prisma.bid.create({
    data: {
      listingId: listing.id,
      userId: session.user.id,
      amountCents: parsed.data.amountCents,
    },
  });

  // Anti-snipe extension
  if (listing.marketplace.antiSnipe && listing.auctionEndsAt) {
    const msRemaining = listing.auctionEndsAt.getTime() - Date.now();
    if (msRemaining < 5 * 60 * 1000) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { auctionEndsAt: new Date(Date.now() + 5 * 60 * 1000) },
      });
    }
  }

  // Notify previous highest bidder
  const prevHighBid = listing.bids[0];
  if (prevHighBid && prevHighBid.userId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: prevHighBid.userId,
        marketplaceId: listing.marketplaceId,
        kind: "BID_OUTBID",
        title: `You've been outbid on "${listing.title}"`,
        deeplink: `/l/${listing.id}`,
      },
    });
  }

  return NextResponse.json({ id: bid.id, amountCents: bid.amountCents });
}
