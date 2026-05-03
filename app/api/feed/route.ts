import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SHK-055: paged feed for the home page infinite scroll. Returns the next
// page of ACTIVE listings across every marketplace the user belongs to,
// ordered by createdAt desc (matching the SSR initial page).
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const take = Math.min(parseInt(url.searchParams.get("take") ?? "8", 10) || 8, 20);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      memberships: {
        where: { status: "ACTIVE" },
        select: { marketplaceId: true },
      },
      ownedMarketplaces: {
        where: { status: { in: ["ACTIVE", "DRAFT"] } },
        select: { id: true },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ids = [
    ...user.ownedMarketplaces.map((m) => m.id),
    ...user.memberships.map((m) => m.marketplaceId),
  ];
  if (ids.length === 0) return NextResponse.json({ items: [], nextCursor: null });

  const items = await prisma.listing.findMany({
    where: { marketplaceId: { in: ids }, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      marketplace: { select: { name: true, slug: true, primaryColor: true } },
      _count: { select: { bids: true } },
    },
  });

  const hasMore = items.length > take;
  const page = hasMore ? items.slice(0, take) : items;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json({
    items: page.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      images: l.images,
      priceCents: l.priceCents,
      auctionStartCents: l.auctionStartCents,
      auctionEndsAt: l.auctionEndsAt ? l.auctionEndsAt.toISOString() : null,
      createdAt: l.createdAt.toISOString(),
      bidCount: l._count.bids,
      marketplace: l.marketplace,
    })),
    nextCursor,
  });
}
