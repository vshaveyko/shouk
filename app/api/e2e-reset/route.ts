import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Test-only helper that restores the seed's four canonical memberships
// (owner + member + reviewer on Ferrari Frenzy / Gooners United) to ACTIVE.
// Exists so destructive e2e tests (e.g. "owner can suspend a member") don't
// bleed state into later tests in the same run. Gated to non-production.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  await prisma.membership.updateMany({
    where: {
      user: { email: { in: ["owner@shouks.test", "member@shouks.test", "reviewer@shouks.test"] } },
    },
    data: { status: "ACTIVE" },
  });
  return NextResponse.json({ ok: true });
}
