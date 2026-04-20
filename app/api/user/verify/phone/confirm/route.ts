import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({ code: z.string().length(6) });

declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, { code: string; phoneNumber: string; expiresAt: number }> | undefined;
}
const store = globalThis.__otpStore ?? (globalThis.__otpStore = new Map());

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  const record = store.get(session.user.id);
  if (!record || record.expiresAt < Date.now() || record.code !== parsed.data.code) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phoneVerified: true, phoneNumber: record.phoneNumber },
  });
  await prisma.verifiedAccount.upsert({
    where: { userId_provider: { userId: session.user.id, provider: "PHONE" } },
    update: { handle: record.phoneNumber, verifiedAt: new Date() },
    create: { userId: session.user.id, provider: "PHONE", handle: record.phoneNumber },
  });
  store.delete(session.user.id);
  return NextResponse.json({ ok: true });
}
