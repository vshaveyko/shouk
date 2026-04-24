import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const submitSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).default({}),
  referrerCode: z.string().optional(),
});

// Submit a new application
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    include: { applicationQuestions: true },
  });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (mp.status !== "ACTIVE") return NextResponse.json({ error: "Marketplace is not accepting applications." }, { status: 409 });

  // Check verification requirements
  const verified = await prisma.verifiedAccount.findMany({
    where: { userId: session.user.id },
    select: { provider: true },
  });
  const verifiedSet = new Set(verified.map((v) => v.provider));
  const missing = mp.requiredVerifications.filter((p) => !verifiedSet.has(p));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required verifications: ${missing.join(", ")}`, missing },
      { status: 409 },
    );
  }

  // Already a member?
  const existingMembership = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
  });
  if (existingMembership && existingMembership.status === "ACTIVE") {
    return NextResponse.json({ error: "You're already a member." }, { status: 409 });
  }

  const pending = await prisma.application.findFirst({
    where: { userId: session.user.id, marketplaceId: mp.id, status: "PENDING" },
  });
  if (pending) {
    return NextResponse.json({ error: "You already have a pending application." }, { status: 409 });
  }

  const parsed = submitSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Check required question answers
  for (const q of mp.applicationQuestions) {
    if (q.required && !parsed.data.answers[q.id]) {
      return NextResponse.json({ error: `Question "${q.label}" is required.` }, { status: 400 });
    }
  }

  // PUBLIC marketplaces auto-admit everyone on submit (SHK-042). Referral
  // marketplaces can also opt in via autoApprove.
  const autoApprove =
    mp.entryMethod === "PUBLIC" ||
    (mp.autoApprove && mp.entryMethod !== "APPLICATION");

  const application = await prisma.application.create({
    data: {
      userId: session.user.id,
      marketplaceId: mp.id,
      answers: parsed.data.answers,
      status: autoApprove ? "APPROVED" : "PENDING",
    },
  });

  if (autoApprove) {
    await prisma.membership.upsert({
      where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
      update: { status: "ACTIVE", role: "MEMBER" },
      create: { userId: session.user.id, marketplaceId: mp.id, role: "MEMBER", status: "ACTIVE" },
    });
  }

  // Notify owner
  await prisma.notification.create({
    data: {
      userId: mp.ownerId,
      marketplaceId: mp.id,
      kind: "APPLICATION_SUBMITTED",
      title: `New application from ${session.user.name ?? "a new user"}`,
      deeplink: `/owner/${mp.slug}/applications/${application.id}`,
    },
  });

  return NextResponse.json({ id: application.id, status: application.status });
}
