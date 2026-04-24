import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Light polling path (SHK-040): the NotificationBell hits us every 30s
  // just to refresh its unread count — skip the full items payload so we
  // only pay for a cheap COUNT query.
  const { searchParams } = new URL(req.url);
  if (searchParams.get("countOnly") === "1") {
    const unread = await prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    });
    return NextResponse.json({ unread });
  }

  const items = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { marketplace: { select: { slug: true, name: true, primaryColor: true } } },
  });
  const unread = items.filter((n) => !n.readAt).length;
  return NextResponse.json({ items, unread });
}

const markReadSchema = z.object({ ids: z.array(z.string()).optional() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = markReadSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      readAt: null,
      ...(parsed.data.ids ? { id: { in: parsed.data.ids } } : {}),
    },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
