import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateThread } from "@/lib/messages";

export const runtime = "nodejs";

async function activeMembership(userId: string, marketplaceId: string) {
  return prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId, marketplaceId } },
  });
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mp = await prisma.marketplace.findUnique({ where: { slug: params.slug } });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await activeMembership(session.user.id, mp.id);
  const isOwner = mp.ownerId === session.user.id;
  if (!isOwner && (!membership || membership.status !== "ACTIVE")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const threads = await prisma.messageThread.findMany({
    where: {
      marketplaceId: mp.id,
      participants: { some: { userId: session.user.id } },
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, priceCents: true, currency: true } },
      participants: {
        include: {
          user: { select: { id: true, displayName: true, name: true, image: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, senderId: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ threads });
}

const startSchema = z.object({
  recipientId: z.string().min(1),
  listingId: z.string().min(1).optional().nullable(),
  body: z.string().trim().min(1).max(4000).optional(),
});

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const parsed = startSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const mp = await prisma.marketplace.findUnique({ where: { slug: params.slug } });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.recipientId === userId) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const [senderMembership, recipientMembership] = await Promise.all([
    activeMembership(userId, mp.id),
    activeMembership(parsed.data.recipientId, mp.id),
  ]);
  const senderAllowed = mp.ownerId === userId || senderMembership?.status === "ACTIVE";
  const recipientAllowed =
    mp.ownerId === parsed.data.recipientId || recipientMembership?.status === "ACTIVE";
  if (!senderAllowed || !recipientAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: parsed.data.listingId },
      select: { marketplaceId: true },
    });
    if (!listing || listing.marketplaceId !== mp.id) {
      return NextResponse.json({ error: "Invalid listing" }, { status: 400 });
    }
  }

  const thread = await findOrCreateThread({
    marketplaceId: mp.id,
    listingId: parsed.data.listingId ?? null,
    userIds: [userId, parsed.data.recipientId],
  });

  if (parsed.data.body) {
    await prisma.$transaction([
      prisma.message.create({
        data: { threadId: thread.id, senderId: userId, body: parsed.data.body },
      }),
      prisma.messageThread.update({
        where: { id: thread.id },
        data: { lastMessageAt: new Date() },
      }),
    ]);
  }

  return NextResponse.json({ threadId: thread.id });
}
