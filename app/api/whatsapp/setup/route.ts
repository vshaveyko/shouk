/**
 * Owner links a WhatsApp group to a marketplace.
 *
 * Flow: owner has already scanned QR and picked a group they admin.
 * We:
 *   1. Read the group's participant phone numbers from the session.
 *   2. Persist whatsappGroupId/Name on the marketplace.
 *   3. Bulk-create PhoneInvite rows for participants who aren't active members.
 *   4. Log (stub) an SMS notification for each — no actual SMS sent yet.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  whatsappSessions,
  sessionBelongsTo,
  sendSmsStub,
  WHATSAPP_ENABLED,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

const schema = z.object({
  marketplaceId: z.string(),
  sessionId: z.string(),
  groupId: z.string(),
  groupName: z.string(),
});

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
  const { marketplaceId, sessionId, groupId, groupName } = parsed.data;
  if (!sessionBelongsTo(sessionId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Permission: owner or admin
  const mp = await prisma.marketplace.findUnique({ where: { id: marketplaceId } });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (mp.ownerId !== session.user.id) {
    const m = await prisma.membership.findUnique({
      where: {
        userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id },
      },
    });
    if (!m || (m.role !== "OWNER" && m.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const phones = await whatsappSessions.getGroupMembers(sessionId, groupId);

  // Link the group (will throw on unique violation if another marketplace owns it)
  try {
    await prisma.marketplace.update({
      where: { id: marketplaceId },
      data: { whatsappGroupId: groupId, whatsappGroupName: groupName },
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "This WhatsApp group is already linked to another marketplace." },
        { status: 409 },
      );
    }
    throw err;
  }

  let invited = 0;
  if (phones.length > 0) {
    // Skip phones belonging to already-active members
    const active = await prisma.membership.findMany({
      where: {
        marketplaceId: mp.id,
        status: "ACTIVE",
        user: { phoneNumber: { in: phones } },
      },
      select: { user: { select: { phoneNumber: true } } },
    });
    const skip = new Set(active.map((a) => a.user.phoneNumber).filter(Boolean));
    const toInvite = phones.filter((p) => p && !skip.has(p));

    if (toInvite.length > 0) {
      const result = await prisma.phoneInvite.createMany({
        data: toInvite.map((phone) => ({
          marketplaceId: mp.id,
          phone,
          source: "whatsapp_group_import",
          issuerId: session.user.id,
        })),
        skipDuplicates: true,
      });
      invited = result.count;

      // Stubbed SMS — log, don't send
      const message = `You've been invited to ${mp.name} on Shouks. Visit ${process.env.NEXT_PUBLIC_APP_URL ?? ""}/apply/${mp.slug} to join.`;
      for (const phone of toInvite) sendSmsStub(phone, message);
    }
  }

  whatsappSessions.destroySession(sessionId).catch(() => {});
  return NextResponse.json({ linked: true, invited });
}
