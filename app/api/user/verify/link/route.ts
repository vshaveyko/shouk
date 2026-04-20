import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const linkSchema = z.object({
  provider: z.enum(["GOOGLE", "FACEBOOK", "INSTAGRAM", "LINKEDIN", "TWITTER"]),
  handle: z.string().min(1).max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = linkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { provider, handle } = parsed.data;

  const existing = await prisma.verifiedAccount.findUnique({
    where: { provider_handle: { provider, handle } },
  });
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.json(
      { error: "This account is already associated with another Shouks user." },
      { status: 409 },
    );
  }

  const record = await prisma.verifiedAccount.upsert({
    where: { userId_provider: { userId: session.user.id, provider } },
    update: { handle, verifiedAt: new Date() },
    create: { userId: session.user.id, provider, handle },
  });
  return NextResponse.json({ provider: record.provider, handle: record.handle });
}

const unlinkSchema = z.object({
  provider: z.enum(["GOOGLE", "FACEBOOK", "INSTAGRAM", "LINKEDIN", "TWITTER", "PHONE"]),
});

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = unlinkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.verifiedAccount.deleteMany({
    where: { userId: session.user.id, provider: parsed.data.provider },
  });
  return NextResponse.json({ ok: true });
}
