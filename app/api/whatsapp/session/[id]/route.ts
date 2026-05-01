import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { whatsappSessions, sessionBelongsTo, WHATSAPP_ENABLED } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!WHATSAPP_ENABLED) {
    return NextResponse.json({ error: "WhatsApp not enabled" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!sessionBelongsTo(params.id, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(whatsappSessions.getStatus(params.id));
}

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!sessionBelongsTo(params.id, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await whatsappSessions.destroySession(params.id).catch(() => {});
  return NextResponse.json({ ok: true });
}
