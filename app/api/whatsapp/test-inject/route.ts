/**
 * Test-only: seeds an authenticated WhatsApp session directly, bypassing
 * Puppeteer + QR scan. Used by Playwright to exercise setup/join/verify
 * flows without a real phone.
 *
 * Gated to non-production AND requires WHATSAPP_TEST_INJECT=1.
 */
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { auth } from "@/auth";
import { whatsappSessions } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  phone: z.string(),
  groups: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      isAdmin: z.boolean(),
      memberCount: z.number().int().nonnegative(),
    }),
  ),
});

export async function POST(req: Request) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.WHATSAPP_TEST_INJECT !== "1"
  ) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const sessionId = `wa_${session.user.id}_${nanoid(8)}`;
  whatsappSessions._injectForTest(sessionId, parsed.data);
  return NextResponse.json({ sessionId });
}
