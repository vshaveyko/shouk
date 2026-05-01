import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      seller: { select: { id: true, displayName: true, image: true } },
      marketplace: { select: { id: true, slug: true, name: true, moderationRequired: true } },
      bids: { include: { user: { select: { id: true, displayName: true, image: true } } }, orderBy: { amountCents: "desc" } },
      _count: { select: { bids: true, saves: true } },
    },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Increment view count (fire-and-forget)
  prisma.listing.update({
    where: { id: listing.id },
    data: { views: { increment: 1 } },
  }).catch(() => {});

  return NextResponse.json(listing);
}

const editSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  priceCents: z.number().int().min(0).optional().nullable(),
  schemaValues: z.record(z.string(), z.unknown()).optional(),
  images: z.array(z.string().min(1)).optional(),
  status: z.enum(["ACTIVE", "SOLD", "CLOSED"]).optional(),
});

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { marketplace: true, bids: true },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = listing.sellerId === session.user.id;
  const isMarketOwner = listing.marketplace.ownerId === session.user.id;
  if (!isOwner && !isMarketOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Only active listings can be edited." }, { status: 400 });
  }
  if (listing.type === "AUCTION" && listing.bids.length > 0) {
    return NextResponse.json({ error: "Auctions with bids cannot be edited." }, { status: 400 });
  }

  const parsed = editSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const moderated = listing.marketplace.moderationRequired && parsed.data.status !== "SOLD" && parsed.data.status !== "CLOSED";

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: {
      ...parsed.data,
      schemaValues: parsed.data.schemaValues ? (parsed.data.schemaValues as object) : undefined,
      editedAt: new Date(),
      status: parsed.data.status ?? (moderated ? "PENDING_REVIEW" : listing.status),
      soldAt: parsed.data.status === "SOLD" ? new Date() : listing.soldAt,
      closedAt: parsed.data.status === "CLOSED" ? new Date() : listing.closedAt,
    },
  });

  // Propagate status changes (SOLD / CLOSED) back to the marketplace
  // feed and detail pages immediately (SHK-048 / SHK-049 — users said
  // "nothing happens" because the soft-cached feed still showed the
  // listing as ACTIVE).
  revalidatePath(`/l/${updated.id}`);
  revalidatePath(`/m/${listing.marketplace.slug}/feed`);
  revalidatePath(`/owner/${listing.marketplace.slug}/listings`);

  return NextResponse.json({ id: updated.id, status: updated.status });
}

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { marketplace: true },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId !== session.user.id && listing.marketplace.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.listing.delete({ where: { id: listing.id } });
  return NextResponse.json({ ok: true });
}
