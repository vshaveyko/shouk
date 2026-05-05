import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { i18n } from '@shipeasy/sdk/client'

export const runtime = "nodejs";

const schema = z.object({
  displayName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? i18n.t('...signup.route.invalidInput') },
      { status: 400 },
    );
  }
  const { displayName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      name: displayName,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
