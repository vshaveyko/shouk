/**
 * Per-marketplace verify: applicant scans QR. If they're in the marketplace's
 * linked WhatsApp group AND the marketplace has whatsappAutoApproval, approve
 * them as an active member immediately.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { whatsappSessions, sessionBelongsTo, WHATSAPP_ENABLED } from "@/lib/whatsapp";

export const runtime = "nodejs";

const schema = z.object({ sessionId: z.string(), marketplaceId: z.string() });

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
  const { sessionId, marketplaceId } = parsed.data;
  if (!sessionBelongsTo(sessionId, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mp = await prisma.marketplace.findUnique({ where: { id: marketplaceId } });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!mp.whatsappGroupId || !mp.whatsappAutoApproval) {
    return NextResponse.json(
      { error: "This marketplace does not use WhatsApp auto-approval." },
      { status: 412 },
    );
  }

  const status = whatsappSessions.getStatus(sessionId);
  if (status.state !== "authenticated" || !status.groups) {
    return NextResponse.json(
      { error: "WhatsApp not authenticated yet." },
      { status: 412 },
    );
  }

  const inGroup = status.groups.some((g) => g.id === mp.whatsappGroupId);

  // QR link proves SIM control → record phone as verified
  if (status.phone) {
    await prisma.user
      .update({
        where: { id: session.user.id },
        data: { phoneNumber: status.phone, phoneVerified: true },
      })
      .catch(() => {});
  }

  whatsappSessions.destroySession(sessionId).catch(() => {});

  if (!inGroup) return NextResponse.json({ verified: false, approved: false });

  // Approve membership
  const existing = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
  });
  if (existing?.status === "BANNED") {
    return NextResponse.json({ verified: true, approved: false });
  }

  await prisma.membership.upsert({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
    update: { status: "ACTIVE", role: "MEMBER" },
    create: {
      userId: session.user.id,
      marketplaceId: mp.id,
      role: "MEMBER",
      status: "ACTIVE",
    },
  });
  await prisma.application.updateMany({
    where: {
      userId: session.user.id,
      marketplaceId: mp.id,
      status: "PENDING",
    },
    data: { status: "APPROVED", reviewedAt: new Date() },
  });
  if (status.phone) {
    await prisma.phoneInvite.updateMany({
      where: { marketplaceId: mp.id, phone: status.phone, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });
  }

  return NextResponse.json({ verified: true, approved: true });
}
