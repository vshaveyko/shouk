import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mp = await prisma.marketplace.findUnique({ where: { slug: params.slug } });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = mp.ownerId === session.user.id;
  if (!isOwner) {
    const m = await prisma.membership.findUnique({
      where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
    });
    if (!m || (m.role !== "ADMIN" && m.role !== "OWNER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 864e5);
  const d30 = new Date(now.getTime() - 30 * 864e5);
  const d60 = new Date(now.getTime() - 60 * 864e5);

  const [
    membersTotal,
    membersLast30,
    membersPrev30,
    listingsTotal,
    listingsLast7,
    listingsLast30,
    applicationsPending,
    applicationsApproved30,
    applicationsRejected30,
  ] = await Promise.all([
    prisma.membership.count({ where: { marketplaceId: mp.id, status: "ACTIVE" } }),
    prisma.membership.count({
      where: { marketplaceId: mp.id, status: "ACTIVE", joinedAt: { gte: d30 } },
    }),
    prisma.membership.count({
      where: {
        marketplaceId: mp.id,
        status: "ACTIVE",
        joinedAt: { gte: d60, lt: d30 },
      },
    }),
    prisma.listing.count({ where: { marketplaceId: mp.id } }),
    prisma.listing.count({ where: { marketplaceId: mp.id, createdAt: { gte: d7 } } }),
    prisma.listing.count({ where: { marketplaceId: mp.id, createdAt: { gte: d30 } } }),
    prisma.application.count({ where: { marketplaceId: mp.id, status: "PENDING" } }),
    prisma.application.count({
      where: { marketplaceId: mp.id, status: "APPROVED", reviewedAt: { gte: d30 } },
    }),
    prisma.application.count({
      where: { marketplaceId: mp.id, status: "REJECTED", reviewedAt: { gte: d30 } },
    }),
  ]);

  // Revenue: naive estimate — count of ACTIVE members * configured prices.
  // In reality, subscribers would come from Stripe. MVP: total active members (paid marketplace only).
  const activeMonthlyCents = mp.isPaid && mp.monthlyPriceCents ? membersTotal * mp.monthlyPriceCents : 0;
  const activeAnnualCents = mp.isPaid && mp.annualPriceCents ? membersTotal * mp.annualPriceCents : 0;

  return NextResponse.json({
    members: { total: membersTotal, last30: membersLast30, prev30: membersPrev30 },
    listings: { total: listingsTotal, last7: listingsLast7, last30: listingsLast30 },
    applications: {
      pending: applicationsPending,
      approvedLast30: applicationsApproved30,
      rejectedLast30: applicationsRejected30,
    },
    revenue: { activeMonthlyCents, activeAnnualCents },
  });
}
