import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function csvEscape(v: string | null | undefined): string {
  const s = v ?? "";
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(_req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const mp = await prisma.marketplace.findUnique({ where: { slug: params.slug } });
  if (!mp) return new Response("Not found", { status: 404 });
  if (mp.ownerId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const members = await prisma.membership.findMany({
    where: { marketplaceId: mp.id, status: "ACTIVE" },
    include: { user: { select: { email: true, displayName: true, name: true } } },
    orderBy: { joinedAt: "desc" },
  });

  const header = ["Name", "Email", "Role", "Joined"];
  const rows = members.map((m) => [
    csvEscape(m.user.displayName ?? m.user.name ?? ""),
    csvEscape(m.user.email ?? ""),
    csvEscape(m.role),
    csvEscape(m.joinedAt.toISOString()),
  ]);
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${mp.slug}-subscribers.csv"`,
    },
  });
}
