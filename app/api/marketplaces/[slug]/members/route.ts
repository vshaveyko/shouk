import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mp = await prisma.marketplace.findUnique({ where: { slug: params.slug } });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only owner/admins can list members
  const m = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
  });
  if (!m) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.membership.findMany({
    where: { marketplaceId: mp.id },
    include: {
      user: { select: { id: true, displayName: true, image: true, email: true, verifiedAccounts: { select: { provider: true, handle: true } } } },
    },
    orderBy: { joinedAt: "desc" },
  });
  return NextResponse.json(members);
}

const actionSchema = z.object({
  userId: z.string(),
  action: z.enum(["SUSPEND", "BAN", "REINSTATE", "PROMOTE_ADMIN", "PROMOTE_MOD", "DEMOTE", "REMOVE"]),
  reason: z.string().max(500).optional(),
  until: z.string().datetime().optional(),
});

export async function POST(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mp = await prisma.marketplace.findUnique({ where: { slug: params.slug } });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = mp.ownerId === session.user.id;
  const acting = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
  });
  if (!isOwner && (!acting || (acting.role !== "ADMIN" && acting.role !== "MODERATOR"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const target = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: parsed.data.userId, marketplaceId: mp.id } },
  });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "OWNER") return NextResponse.json({ error: "Cannot act on the owner." }, { status: 400 });

  // Only the owner can promote/demote to Admin
  if ((parsed.data.action === "PROMOTE_ADMIN" || parsed.data.action === "PROMOTE_MOD" || parsed.data.action === "DEMOTE") && !isOwner) {
    return NextResponse.json({ error: "Only the owner can change roles." }, { status: 403 });
  }

  switch (parsed.data.action) {
    case "SUSPEND":
      // WA-009: pull the suspended user out of any active auctions in
      // this marketplace. Their open bids are deleted so the leaderboard
      // reflects only members currently allowed to engage; otherwise a
      // suspended user could still "win" an auction that closes during
      // their suspension. Their own listings stay live — suspension is
      // temporary, and BAN is the path that takes inventory down.
      await prisma.$transaction([
        prisma.membership.update({
          where: { id: target.id },
          data: {
            status: "SUSPENDED",
            suspensionReason: parsed.data.reason ?? null,
            suspendedUntil: parsed.data.until ? new Date(parsed.data.until) : null,
          },
        }),
        prisma.bid.deleteMany({
          where: {
            userId: parsed.data.userId,
            listing: { marketplaceId: mp.id, status: "ACTIVE" },
          },
        }),
      ]);
      break;
    case "BAN":
      // WA-009: BAN cancels the user's open bids in this marketplace in
      // addition to closing their own listings (existing behavior). The
      // listing.updateMany REMOVES their inventory, but bids they placed
      // on other members' auctions live on Bid not Listing — they need
      // their own deleteMany.
      await prisma.$transaction([
        prisma.membership.update({
          where: { id: target.id },
          data: { status: "BANNED", banReason: parsed.data.reason ?? null },
        }),
        prisma.listing.updateMany({
          where: { marketplaceId: mp.id, sellerId: parsed.data.userId },
          data: { status: "REMOVED" },
        }),
        prisma.bid.deleteMany({
          where: {
            userId: parsed.data.userId,
            listing: { marketplaceId: mp.id, status: "ACTIVE" },
          },
        }),
      ]);
      break;
    case "REINSTATE":
      await prisma.membership.update({
        where: { id: target.id },
        data: { status: "ACTIVE", suspensionReason: null, suspendedUntil: null, banReason: null },
      });
      break;
    case "PROMOTE_ADMIN":
      await prisma.membership.update({ where: { id: target.id }, data: { role: "ADMIN" } });
      break;
    case "PROMOTE_MOD":
      await prisma.membership.update({ where: { id: target.id }, data: { role: "MODERATOR" } });
      break;
    case "DEMOTE":
      await prisma.membership.update({ where: { id: target.id }, data: { role: "MEMBER" } });
      break;
    case "REMOVE":
      await prisma.membership.delete({ where: { id: target.id } });
      break;
  }

  return NextResponse.json({ ok: true });
}
