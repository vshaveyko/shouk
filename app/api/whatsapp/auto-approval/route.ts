import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({ marketplaceId: z.string(), enabled: z.boolean() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const mp = await prisma.marketplace.findUnique({
    where: { id: parsed.data.marketplaceId },
  });
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

  await prisma.marketplace.update({
    where: { id: mp.id },
    data: { whatsappAutoApproval: parsed.data.enabled },
  });
  return NextResponse.json({ ok: true });
}
