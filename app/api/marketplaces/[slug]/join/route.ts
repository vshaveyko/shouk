import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mp = await prisma.marketplace.findUnique({ where: { slug: params.slug } });
  if (!mp || mp.status !== "ACTIVE") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (mp.entryMethod !== "PUBLIC") {
    return NextResponse.json({ error: "This marketplace requires an application." }, { status: 403 });
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyMember: true });
  }

  await prisma.membership.create({
    data: { userId: session.user.id, marketplaceId: mp.id, role: "MEMBER", status: "ACTIVE" },
  });

  return NextResponse.json({ ok: true });
}
