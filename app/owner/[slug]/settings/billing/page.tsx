import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { BillingPanel } from "./BillingPanel";

export default async function BillingSettingsPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireOwnerOf(params.slug);
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      isPaid: true,
      monthlyPriceCents: true,
      annualPriceCents: true,
    },
  });
  if (!mp) return null;

  const members = await prisma.membership.findMany({
    where: { marketplaceId: mp.id, status: "ACTIVE" },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <BillingPanel
      slug={params.slug}
      isPaid={mp.isPaid}
      monthlyPriceCents={mp.monthlyPriceCents}
      annualPriceCents={mp.annualPriceCents}
      members={members.map((m) => ({
        id: m.id,
        joinedAt: m.joinedAt.toISOString(),
        role: m.role as "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER",
        user: {
          id: m.user.id,
          displayName: m.user.displayName ?? m.user.name ?? m.user.email ?? "",
          email: m.user.email ?? "",
          image: m.user.image ?? null,
        },
      }))}
    />
  );
}
