import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const listingCreate = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["FIXED", "AUCTION", "ISO"]).default("FIXED"),
  description: z.string().max(5000).optional(),
  schemaValues: z.record(z.string(), z.unknown()).default({}),
  images: z.array(z.string().min(1)).default([]),
  priceCents: z.number().int().min(0).optional().nullable(),
  currency: z.string().length(3).default("USD"),
  auctionStartCents: z.number().int().min(0).optional().nullable(),
  auctionReserveCents: z.number().int().min(0).optional().nullable(),
  auctionMinIncrementCents: z.number().int().min(1).optional().nullable(),
  auctionEndsAt: z.string().datetime().optional().nullable(),
  draft: z.boolean().default(false),
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    include: { schemaFields: { where: { archived: false } } },
  });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (mp.status !== "ACTIVE") return NextResponse.json({ error: "Marketplace inactive" }, { status: 409 });

  const membership = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
  });
  if (!membership || membership.status !== "ACTIVE") {
    return NextResponse.json({ error: "You must be an active member to post." }, { status: 403 });
  }

  const parsed = listingCreate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(". ") }, { status: 400 });
  }
  const d = parsed.data;

  if (d.type === "AUCTION") {
    if (!mp.auctionsEnabled) return NextResponse.json({ error: "Auctions are disabled" }, { status: 400 });
    if (!d.auctionStartCents || !d.auctionMinIncrementCents || !d.auctionEndsAt) {
      return NextResponse.json({ error: "Auction listings require start price, min increment, and end time." }, { status: 400 });
    }
  }
  if (d.type === "FIXED" && (d.priceCents == null || d.priceCents < 0)) {
    return NextResponse.json({ error: "Fixed-price listings require a price." }, { status: 400 });
  }

  // V1 uses a hardcoded watches form (SHK-020); the only mandatory
  // fields are Title, Price, and one image. We still enforce the image
  // requirement when the marketplace's schema has a required IMAGE
  // field, but optional legacy schema fields aren't rendered by the UI
  // and therefore aren't enforced server-side either.
  for (const field of mp.schemaFields) {
    if (field.type === "IMAGE" && field.required) {
      if (!d.images || d.images.length < (field.minImages ?? 1)) {
        return NextResponse.json(
          { error: `Upload at least ${field.minImages ?? 1} image(s).` },
          { status: 400 },
        );
      }
    }
  }

  // Content moderation removed from V1 — all published listings go ACTIVE immediately.
  const status = d.draft ? "DRAFT" : "ACTIVE";

  const listing = await prisma.listing.create({
    data: {
      marketplaceId: mp.id,
      sellerId: session.user.id,
      title: d.title,
      type: d.type,
      description: d.description ?? null,
      schemaValues: d.schemaValues as object,
      images: d.images,
      priceCents: d.type === "FIXED" ? d.priceCents ?? null : null,
      currency: d.currency,
      auctionStartCents: d.auctionStartCents ?? null,
      auctionReserveCents: d.auctionReserveCents ?? null,
      auctionMinIncrementCents: d.auctionMinIncrementCents ?? null,
      auctionEndsAt: d.auctionEndsAt ? new Date(d.auctionEndsAt) : null,
      auctionStartsAt: d.type === "AUCTION" ? new Date() : null,
      status,
      publishedAt: status === "ACTIVE" ? new Date() : null,
    },
  });

  // Make the new listing visible on the marketplace feed + detail pages
  // immediately (SHK-050). The feed already uses dynamic="force-dynamic",
  // but the client-router keeps a soft cache of recently-visited server
  // components — without a revalidate, hitting Back from /l/<id> to
  // /m/<slug>/feed shows the stale pre-create snapshot.
  revalidatePath(`/m/${params.slug}/feed`);
  revalidatePath(`/m/${params.slug}`);
  revalidatePath(`/owner/${params.slug}/listings`);

  return NextResponse.json({ id: listing.id, status: listing.status });
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const mp = await prisma.marketplace.findUnique({ where: { slug: params.slug } });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase();
  const type = searchParams.get("type");
  const sort = searchParams.get("sort") ?? "new";

  const listings = await prisma.listing.findMany({
    where: {
      marketplaceId: mp.id,
      status: { in: ["ACTIVE"] },
      ...(type ? { type: type as "FIXED" | "AUCTION" | "ISO" } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy:
      sort === "price-asc"
        ? { priceCents: "asc" }
        : sort === "price-desc"
          ? { priceCents: "desc" }
          : { createdAt: "desc" },
    include: {
      seller: { select: { id: true, displayName: true, image: true } },
      _count: { select: { bids: true, saves: true } },
    },
    take: 60,
  });

  return NextResponse.json(listings);
}
