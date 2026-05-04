import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// SHK-053: toggle a marketplace favorite for the current user. POST adds,
// DELETE removes. Idempotent on both sides.
export async function POST(_req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.marketplaceFavorite.upsert({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
    create: { userId: session.user.id, marketplaceId: mp.id },
    update: {},
  });

  return NextResponse.json({ favorited: true });
}

export async function DELETE(_req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!mp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.marketplaceFavorite.deleteMany({
    where: { userId: session.user.id, marketplaceId: mp.id },
  });

  return NextResponse.json({ favorited: false });
}
