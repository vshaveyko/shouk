/**
 * Member scanned QR → find all marketplaces linked to groups they're in →
 * auto-join ones that have whatsappAutoApproval enabled. For others, create
 * an approved-pending Application so owners can review.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { whatsappSessions, sessionBelongsTo, WHATSAPP_ENABLED } from "@/lib/whatsapp";

export const runtime = "nodejs";

const schema = z.object({ sessionId: z.string() });

export async function POST(req: Request) {
  if (!WHATSAPP_ENABLED) {
    return NextResponse.json({ error: "WhatsApp not enabled" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { sessionId } = parsed.data;
  if (!sessionBelongsTo(sessionId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = whatsappSessions.getStatus(sessionId);
  if (status.state !== "authenticated" || !status.groups) {
    return NextResponse.json(
      { error: "WhatsApp not authenticated yet." },
      { status: 412 },
    );
  }

  // Record phone on user (QR scan proves SIM control)
  if (status.phone) {
    await prisma.user
      .update({
        where: { id: session.user.id },
        data: { phoneNumber: status.phone, phoneVerified: true },
      })
      .catch(() => {});
  }

  const groupJids = status.groups.map((g) => g.id);
  const matches = await prisma.marketplace.findMany({
    where: { whatsappGroupId: { in: groupJids } },
    select: {
      id: true,
      name: true,
      slug: true,
      whatsappAutoApproval: true,
      whatsappGroupName: true,
    },
  });

  const joined: string[] = [];
  for (const mp of matches) {
    const existing = await prisma.membership.findUnique({
      where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
    });
    if (existing?.status === "BANNED") continue;
    if (existing?.status === "ACTIVE") continue;

    if (mp.whatsappAutoApproval) {
      await prisma.membership.upsert({
        where: {
          userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id },
        },
        update: { status: "ACTIVE", role: "MEMBER" },
        create: {
          userId: session.user.id,
          marketplaceId: mp.id,
          role: "MEMBER",
          status: "ACTIVE",
        },
      });
      // Auto-approve any pending application
      await prisma.application.updateMany({
        where: {
          userId: session.user.id,
          marketplaceId: mp.id,
          status: "PENDING",
        },
        data: { status: "APPROVED", reviewedAt: new Date() },
      });
      // Mark any matching phone invite accepted
      if (status.phone) {
        await prisma.phoneInvite.updateMany({
          where: { marketplaceId: mp.id, phone: status.phone, status: "PENDING" },
          data: { status: "ACCEPTED" },
        });
      }
      joined.push(mp.name);
    }
  }

  whatsappSessions.destroySession(sessionId).catch(() => {});
  return NextResponse.json({ joined, total: joined.length });
}
