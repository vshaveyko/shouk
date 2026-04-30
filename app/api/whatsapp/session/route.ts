import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { whatsappSessions, WHATSAPP_ENABLED } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!WHATSAPP_ENABLED) {
    return NextResponse.json({ error: "WhatsApp not enabled" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const sessionId = `wa_${session.user.id}_${nanoid(8)}`;
  try {
    await whatsappSessions.createSession(sessionId);
    return NextResponse.json({ sessionId });
  } catch (err: any) {
    console.error("[WhatsApp/session] create error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create session" },
      { status: 500 },
    );
  }
}
