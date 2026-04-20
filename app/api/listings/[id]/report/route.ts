import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.enum(["SPAM", "MISLEADING", "PROHIBITED", "DUPLICATE", "OTHER"]),
  detail: z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.report.create({
    data: {
      listingId: listing.id,
      reporterId: session.user.id,
      reason: parsed.data.reason,
      detail: parsed.data.detail ?? null,
    },
  });

  // Auto-hide if 3+ unique reports
  const count = await prisma.report.groupBy({
    by: ["reporterId"],
    where: { listingId: listing.id, resolved: false },
    _count: true,
  });
  if (count.length >= 3 && listing.status === "ACTIVE") {
    await prisma.listing.update({ where: { id: listing.id }, data: { status: "SHADOW_HIDDEN" } });
    await prisma.notification.create({
      data: {
        userId: listing.sellerId,
        marketplaceId: listing.marketplaceId,
        kind: "LISTING_FLAGGED",
        title: `"${listing.title}" is under review`,
        preview: "Your listing was reported and is temporarily hidden pending admin review.",
        deeplink: `/l/${listing.id}`,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
