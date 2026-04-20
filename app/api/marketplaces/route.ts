import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { FieldType, VerifyProvider, EntryMethod } from "@prisma/client";

export const runtime = "nodejs";

const fieldSchema = z.object({
  name: z.string().min(1).max(50),
  label: z.string().min(1).max(80),
  helpText: z.string().max(200).optional().nullable(),
  type: z.enum(["SHORT_TEXT", "LONG_TEXT", "NUMBER", "CURRENCY", "SELECT", "MULTI_SELECT", "DATE", "IMAGE"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional().nullable(),
  minImages: z.number().int().min(0).max(20).optional().nullable(),
  maxImages: z.number().int().min(1).max(20).optional().nullable(),
  cardPreview: z.boolean().optional(),
});

const questionSchema = z.object({
  label: z.string().min(1).max(200),
  helpText: z.string().max(200).optional().nullable(),
  type: z.enum(["SHORT_TEXT", "LONG_TEXT", "NUMBER", "SELECT", "MULTI_SELECT", "DATE"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional().nullable(),
});

const createSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/).optional(),
  tagline: z.string().max(140).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  category: z.string().min(1),
  coverImageUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/).optional().nullable(),
  entryMethod: z.enum(["APPLICATION", "INVITE", "REFERRAL"]).default("APPLICATION"),
  requiredVerifications: z.array(z.enum(["GOOGLE", "FACEBOOK", "INSTAGRAM", "LINKEDIN", "TWITTER", "PHONE"])).min(1),
  autoApprove: z.boolean().default(false),
  auctionsEnabled: z.boolean().default(false),
  antiSnipe: z.boolean().default(true),
  moderationRequired: z.boolean().default(false),
  isPaid: z.boolean().default(false),
  monthlyPriceCents: z.number().int().min(0).optional().nullable(),
  annualPriceCents: z.number().int().min(0).optional().nullable(),
  schemaFields: z.array(fieldSchema).min(1).max(25),
  applicationQuestions: z.array(questionSchema).default([]),
  publish: z.boolean().default(true),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(". ") },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const slug = (data.slug ?? slugify(data.name)).toLowerCase();
  const existing = await prisma.marketplace.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "That URL slug is already taken." }, { status: 409 });
  }

  const mp = await prisma.marketplace.create({
    data: {
      slug,
      name: data.name,
      tagline: data.tagline ?? null,
      description: data.description ?? null,
      category: data.category,
      coverImageUrl: data.coverImageUrl ?? null,
      primaryColor: data.primaryColor ?? null,
      ownerId: session.user.id,
      entryMethod: data.entryMethod as EntryMethod,
      requiredVerifications: data.requiredVerifications as VerifyProvider[],
      autoApprove: data.autoApprove,
      auctionsEnabled: data.auctionsEnabled,
      antiSnipe: data.antiSnipe,
      moderationRequired: data.moderationRequired,
      isPaid: data.isPaid,
      monthlyPriceCents: data.monthlyPriceCents ?? null,
      annualPriceCents: data.annualPriceCents ?? null,
      status: data.publish ? "ACTIVE" : "DRAFT",
      publishedAt: data.publish ? new Date() : null,
      schemaFields: {
        create: data.schemaFields.map((f, i) => ({
          order: i,
          name: f.name,
          label: f.label,
          helpText: f.helpText ?? null,
          type: f.type as FieldType,
          required: f.required,
          options: f.options ? (f.options as unknown as object) : undefined,
          minImages: f.minImages ?? null,
          maxImages: f.maxImages ?? null,
          cardPreview: f.cardPreview ?? false,
        })),
      },
      applicationQuestions: {
        create: data.applicationQuestions.map((q, i) => ({
          order: i,
          label: q.label,
          helpText: q.helpText ?? null,
          type: q.type as FieldType,
          required: q.required,
          options: q.options ? (q.options as unknown as object) : undefined,
        })),
      },
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER",
          status: "ACTIVE",
        },
      },
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { defaultRole: "OWNER" },
  });

  return NextResponse.json({ id: mp.id, slug: mp.slug });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase();
  const results = await prisma.marketplace.findMany({
    where: {
      status: "ACTIVE",
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] } : {}),
    },
    include: { _count: { select: { memberships: true, listings: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(results);
}
