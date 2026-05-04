/**
 * Owner links a WhatsApp group to a marketplace.
 *
 * Flow: owner has already scanned QR and picked a group they admin.
 * We:
 *   1. Read the group's participant phone numbers from the session.
 *   2. Persist whatsappGroupId/Name on the marketplace.
 *   3. Upsert a User row for each phone (synthetic email if new) and
 *      attach an ACTIVE Membership — idempotent, so re-running is a no-op
 *      for participants already synced.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  whatsappSessions,
  sessionBelongsTo,
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

  let synced = 0;
  const uniquePhones = Array.from(new Set(phones.filter(Boolean)));
  for (const phone of uniquePhones) {
    const digits = phone.replace(/[^0-9]/g, "");
    if (!digits) continue;
    const user = await prisma.user.upsert({
      where: { phoneNumber: phone },
      update: {},
      create: {
        phoneNumber: phone,
        email: `wa-${digits}@phone.local`,
      },
    });
    const membership = await prisma.membership.upsert({
      where: {
        userId_marketplaceId: { userId: user.id, marketplaceId: mp.id },
      },
      update: {},
      create: {
        userId: user.id,
        marketplaceId: mp.id,
        role: "MEMBER",
        status: "ACTIVE",
      },
    });
    if (membership.joinedAt.getTime() > Date.now() - 5_000) synced++;
  }

  whatsappSessions.destroySession(sessionId).catch(() => {});
  return NextResponse.json({ linked: true, synced });
}
