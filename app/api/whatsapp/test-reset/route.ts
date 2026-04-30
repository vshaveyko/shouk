/**
 * Test-only: resets marketplace WhatsApp state + optionally clears a
 * user's pending applications / active membership for a clean slate.
 *
 * Gated: non-production AND WHATSAPP_TEST_INJECT=1.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  slug: z.string(),
  whatsapp: z
    .object({
      groupId: z.string().nullable(),
      groupName: z.string().nullable(),
      autoApproval: z.boolean(),
    })
    .optional(),
  clearApplicantEmail: z.string().optional(),
});

export async function POST(req: Request) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.WHATSAPP_TEST_INJECT !== "1"
  ) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const mp = await prisma.marketplace.findUnique({ where: { slug: parsed.data.slug } });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.whatsapp) {
    await prisma.marketplace.update({
      where: { id: mp.id },
      data: {
        whatsappGroupId: parsed.data.whatsapp.groupId,
        whatsappGroupName: parsed.data.whatsapp.groupName,
        whatsappAutoApproval: parsed.data.whatsapp.autoApproval,
      },
    });
  }

  if (parsed.data.clearApplicantEmail) {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.clearApplicantEmail },
    });
    if (user) {
      await prisma.application.deleteMany({
        where: { userId: user.id, marketplaceId: mp.id },
      });
      await prisma.membership.deleteMany({
        where: { userId: user.id, marketplaceId: mp.id },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
