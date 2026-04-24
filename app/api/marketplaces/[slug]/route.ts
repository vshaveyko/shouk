import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    include: {
      schemaFields: { orderBy: { order: "asc" }, where: { archived: false } },
      applicationQuestions: { orderBy: { order: "asc" } },
      owner: { select: { id: true, displayName: true, image: true } },
      _count: { select: { memberships: true, listings: true } },
    },
  });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mp);
}

const updateSchema = z.object({
  tagline: z.string().max(140).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/).optional().nullable(),
  entryMethod: z.enum(["APPLICATION", "INVITE", "REFERRAL", "PUBLIC"]).optional(),
  requiredVerifications: z.array(z.enum(["GOOGLE", "FACEBOOK", "INSTAGRAM", "LINKEDIN", "TWITTER", "PHONE"])).optional(),
  autoApprove: z.boolean().optional(),
  auctionsEnabled: z.boolean().optional(),
  antiSnipe: z.boolean().optional(),
  moderationRequired: z.boolean().optional(),
  isPaid: z.boolean().optional(),
  monthlyPriceCents: z.number().int().min(0).optional().nullable(),
  annualPriceCents: z.number().int().min(0).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mp = await prisma.marketplace.findUnique({ where: { slug: params.slug } });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (mp.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.marketplace.update({
    where: { id: mp.id },
    data: parsed.data,
  });
  return NextResponse.json({ id: updated.id, slug: updated.slug });
}
