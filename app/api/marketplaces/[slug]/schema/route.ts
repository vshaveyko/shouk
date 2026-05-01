import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const fieldSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().min(0),
  name: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
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
  minImages: z.number().int().min(0).max(20).optional().nullable(),
  maxImages: z.number().int().min(0).max(20).optional().nullable(),
  archived: z.boolean().optional().default(false),
});

const bodySchema = z.object({
  fields: z.array(fieldSchema).max(50),
});

export async function PATCH(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
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

  const existing = await prisma.schemaField.findMany({
    where: { marketplaceId: mp.id },
    select: { id: true, name: true },
  });
  const existingIds = new Set(existing.map((f) => f.id));
  const keepIds = new Set(
    parsed.data.fields.filter((f) => f.id && existingIds.has(f.id)).map((f) => f.id!),
  );
  const removeIds = [...existingIds].filter((id) => !keepIds.has(id));

  // Which removed ones are referenced by live listings? Archive those.
  let toArchive: string[] = [];
  let toDelete: string[] = [];
  if (removeIds.length > 0) {
    const removedFields = existing.filter((f) => removeIds.includes(f.id));
    // A field is "in use" if any listing has a value for its `name` in schemaValues JSON.
    const activeListings = await prisma.listing.findMany({
      where: {
        marketplaceId: mp.id,
        status: { in: ["ACTIVE", "PENDING_REVIEW", "DRAFT", "SOLD", "WON"] },
      },
      select: { schemaValues: true },
    });
    for (const f of removedFields) {
      const referenced = activeListings.some((l) => {
        const v = l.schemaValues as Record<string, unknown> | null;
        if (!v) return false;
        const val = v[f.name];
        return val !== undefined && val !== null && val !== "";
      });
      if (referenced) toArchive.push(f.id);
      else toDelete.push(f.id);
    }
  }

  await prisma.$transaction(async (tx) => {
    // Deletes (safe — no references)
    if (toDelete.length > 0) {
      await tx.schemaField.deleteMany({ where: { id: { in: toDelete } } });
    }
    // Archives (keep referenced data)
    if (toArchive.length > 0) {
      await tx.schemaField.updateMany({
        where: { id: { in: toArchive } },
        data: { archived: true },
      });
    }

    // Upsert/create
    for (const [i, f] of parsed.data.fields.entries()) {
      const payload = {
        order: i,
        name: f.name,
        label: f.label,
        helpText: f.helpText ?? null,
        type: f.type,
        required: !!f.required,
        options:
          f.type === "SELECT" || f.type === "MULTI_SELECT"
            ? ((f.options ?? []).filter((o) => o.trim()) as unknown as object)
            : undefined,
        minImages: f.type === "IMAGE" ? f.minImages ?? 0 : null,
        maxImages: f.type === "IMAGE" ? f.maxImages ?? 10 : null,
        archived: !!f.archived,
      };
      if (f.id && existingIds.has(f.id)) {
        await tx.schemaField.update({
          where: { id: f.id },
          data: payload,
        });
      } else {
        await tx.schemaField.create({
          data: {
            marketplaceId: mp.id,
            ...payload,
          },
        });
      }
    }
  });

  const after = await prisma.schemaField.findMany({
    where: { marketplaceId: mp.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ fields: after, archived: toArchive.length, deleted: toDelete.length });
}
