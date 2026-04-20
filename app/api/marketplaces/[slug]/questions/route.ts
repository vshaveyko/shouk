import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const questionSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().min(0),
  label: z.string().min(1).max(200),
  helpText: z.string().max(300).optional().nullable(),
  type: z.enum([
    "SHORT_TEXT",
    "LONG_TEXT",
    "NUMBER",
    "CURRENCY",
    "SELECT",
    "MULTI_SELECT",
    "DATE",
    "IMAGE",
  ]),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional().nullable(),
});

const bodySchema = z.object({
  fields: z.array(questionSchema).max(30),
});

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mp = await prisma.marketplace.findUnique({ where: { slug: params.slug } });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (mp.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.applicationQuestion.findMany({
    where: { marketplaceId: mp.id },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((f) => f.id));
  const keepIds = new Set(
    parsed.data.fields.filter((f) => f.id && existingIds.has(f.id)).map((f) => f.id!),
  );
  const removeIds = [...existingIds].filter((id) => !keepIds.has(id));

  await prisma.$transaction(async (tx) => {
    if (removeIds.length > 0) {
      await tx.applicationQuestion.deleteMany({ where: { id: { in: removeIds } } });
    }
    for (const [i, q] of parsed.data.fields.entries()) {
      const payload = {
        order: i,
        label: q.label,
        helpText: q.helpText ?? null,
        type: q.type,
        required: !!q.required,
        options:
          q.type === "SELECT" || q.type === "MULTI_SELECT"
            ? ((q.options ?? []).filter((o) => o.trim()) as unknown as object)
            : undefined,
      };
      if (q.id && existingIds.has(q.id)) {
        await tx.applicationQuestion.update({ where: { id: q.id }, data: payload });
      } else {
        await tx.applicationQuestion.create({
          data: { marketplaceId: mp.id, ...payload },
        });
      }
    }
  });

  const after = await prisma.applicationQuestion.findMany({
    where: { marketplaceId: mp.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ fields: after });
}
