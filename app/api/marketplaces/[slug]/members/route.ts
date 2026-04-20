import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
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

export async function POST(req: Request, { params }: { params: { slug: string } }) {
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
      await prisma.membership.update({
        where: { id: target.id },
        data: { status: "SUSPENDED", suspensionReason: parsed.data.reason ?? null, suspendedUntil: parsed.data.until ? new Date(parsed.data.until) : null },
      });
      break;
    case "BAN":
      await prisma.membership.update({
        where: { id: target.id },
        data: { status: "BANNED", banReason: parsed.data.reason ?? null },
      });
      await prisma.listing.updateMany({
        where: { marketplaceId: mp.id, sellerId: parsed.data.userId },
        data: { status: "REMOVED" },
      });
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
