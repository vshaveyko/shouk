import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { RolesPanel } from "./RolesPanel";

export default async function RolesSettingsPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  await requireOwnerOf(params.slug);
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: { id: true, ownerId: true },
  });
  if (!mp) return null;

  const members = await prisma.membership.findMany({
    where: { marketplaceId: mp.id, status: "ACTIVE" },
    include: {
      user: {
        select: { id: true, displayName: true, name: true, email: true, image: true },
      },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "desc" }],
  });

  const simple = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role as "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER",
    joinedAt: m.joinedAt.toISOString(),
    permissions: (m.permissions as Record<string, boolean> | null) ?? null,
    user: {
      id: m.user.id,
      displayName: m.user.displayName ?? m.user.name ?? m.user.email ?? "",
      image: m.user.image ?? null,
      email: m.user.email ?? "",
    },
  }));

  return <RolesPanel slug={params.slug} members={simple} />;
}
