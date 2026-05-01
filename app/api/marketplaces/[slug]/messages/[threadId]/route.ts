import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function loadParticipantThread(threadId: string, userId: string, slug: string) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      marketplace: { select: { slug: true, id: true } },
      participants: true,
    },
  });
  if (!thread) return { error: "Not found", status: 404 as const };
  if (thread.marketplace.slug !== slug) return { error: "Not found", status: 404 as const };
  const mine = thread.participants.find((p) => p.userId === userId);
  if (!mine) return { error: "Forbidden", status: 403 as const };
  return { thread, participant: mine };
}

export async function GET(
  _req: Request,
  props: { params: Promise<{ slug: string; threadId: string }> }
) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await loadParticipantThread(params.threadId, session.user.id, params.slug);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const [messages] = await Promise.all([
    prisma.message.findMany({
      where: { threadId: ctx.thread.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderId: true, body: true, createdAt: true },
    }),
    prisma.threadParticipant.update({
      where: { id: ctx.participant.id },
      data: { lastReadAt: new Date() },
    }),
  ]);

  return NextResponse.json({ messages });
}

const sendSchema = z.object({ body: z.string().trim().min(1).max(4000) });

export async function POST(
  req: Request,
  props: { params: Promise<{ slug: string; threadId: string }> }
) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = sendSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ctx = await loadParticipantThread(params.threadId, session.user.id, params.slug);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const now = new Date();
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { threadId: ctx.thread.id, senderId: session.user.id, body: parsed.data.body },
      select: { id: true, senderId: true, body: true, createdAt: true },
    }),
    prisma.messageThread.update({
      where: { id: ctx.thread.id },
      data: { lastMessageAt: now },
    }),
    prisma.threadParticipant.update({
      where: { id: ctx.participant.id },
      data: { lastReadAt: now },
    }),
  ]);

  return NextResponse.json({ message });
}
