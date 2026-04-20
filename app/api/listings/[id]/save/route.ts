import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.listingSave.findUnique({
    where: { userId_listingId: { userId: session.user.id, listingId: listing.id } },
  });
  if (existing) {
    await prisma.listingSave.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }
  await prisma.listingSave.create({
    data: { userId: session.user.id, listingId: listing.id, marketplaceId: listing.marketplaceId },
  });
  return NextResponse.json({ saved: true });
}
