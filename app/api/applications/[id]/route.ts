import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { applicationApprovedHtml } from "@/app/emails/emailHtml";

export const runtime = "nodejs";

const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_INFO"]),
  note: z.string().max(2000).optional(),
  rejectionReason: z.string().max(100).optional(),
});

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = decisionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: { marketplace: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Permission check: owner, admin, or moderator with member permission
  if (application.marketplace.ownerId !== session.user.id) {
    const m = await prisma.membership.findUnique({
      where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: application.marketplaceId } },
    });
    if (!m || (m.role !== "ADMIN" && m.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let newStatus: "APPROVED" | "REJECTED" | "NEEDS_INFO" = "APPROVED";
  if (parsed.data.decision === "REJECT") newStatus = "REJECTED";
  if (parsed.data.decision === "REQUEST_INFO") newStatus = "NEEDS_INFO";

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: {
      status: newStatus,
      reviewerNote: parsed.data.note ?? null,
      rejectionReason: parsed.data.rejectionReason ?? null,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
  });

  if (newStatus === "APPROVED") {
    await prisma.membership.upsert({
      where: { userId_marketplaceId: { userId: application.userId, marketplaceId: application.marketplaceId } },
      update: { status: "ACTIVE", role: "MEMBER" },
      create: { userId: application.userId, marketplaceId: application.marketplaceId, role: "MEMBER", status: "ACTIVE" },
    });

    // Transactional email (SHK-044). sendEmail is a no-op when
    // RESEND_API_KEY isn't configured — just logs in dev — so this is
    // safe to always fire.
    const applicant = await prisma.user.findUnique({
      where: { id: application.userId },
      select: { email: true, displayName: true, name: true },
    });
    if (applicant?.email) {
      void sendEmail({
        to: applicant.email,
        subject: `You're in · ${application.marketplace.name}`,
        html: applicationApprovedHtml({
          marketplace: application.marketplace.name,
          applicant: applicant.displayName ?? applicant.name ?? undefined,
          ownerCosign: parsed.data.note ?? undefined,
        }),
      });
    }
  }

  const kind: "APPLICATION_APPROVED" | "APPLICATION_REJECTED" | "APPLICATION_NEEDS_INFO" =
    newStatus === "APPROVED" ? "APPLICATION_APPROVED" :
    newStatus === "REJECTED" ? "APPLICATION_REJECTED" :
    "APPLICATION_NEEDS_INFO";

  await prisma.notification.create({
    data: {
      userId: application.userId,
      marketplaceId: application.marketplaceId,
      kind,
      title: newStatus === "APPROVED"
        ? `You're in! ${application.marketplace.name} approved your application.`
        : newStatus === "REJECTED"
          ? `${application.marketplace.name} didn't approve your application.`
          : `${application.marketplace.name} asked for more info.`,
      preview: parsed.data.note ?? null,
      deeplink: newStatus === "APPROVED" ? `/m/${application.marketplace.slug}` : `/apply/${application.marketplace.slug}`,
    },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
