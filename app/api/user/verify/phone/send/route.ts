import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({ phoneNumber: z.string().min(6).max(40) });

// In-memory OTP store for MVP (replace with a real OTP service in prod).
declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, { code: string; phoneNumber: string; expiresAt: number }> | undefined;
}
const store = globalThis.__otpStore ?? (globalThis.__otpStore = new Map());

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

  // Production doesn't have a wired-up SMS provider yet (SHK-033), so
  // we'd silently drop the code on the floor. Fail loud instead of
  // pretending it worked — the UI hides the row when the provider env
  // var isn't set, but this is the server-side backstop.
  const hasProvider = Boolean(process.env.SHOUKS_SMS_PROVIDER);
  if (process.env.NODE_ENV === "production" && !hasProvider) {
    return NextResponse.json(
      { error: "Phone SMS is not available yet." },
      { status: 503 },
    );
  }

  const code = process.env.NODE_ENV === "development" ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
  store.set(session.user.id, {
    code,
    phoneNumber: parsed.data.phoneNumber,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phoneNumber: parsed.data.phoneNumber, phoneVerified: false },
  });

  // In a real build, send SMS via Twilio Verify here.
  if (process.env.NODE_ENV === "development") {
    console.log(`[dev] SMS code for ${parsed.data.phoneNumber}: ${code}`);
  }

  return NextResponse.json({ ok: true, devCode: process.env.NODE_ENV === "development" ? code : undefined });
}
