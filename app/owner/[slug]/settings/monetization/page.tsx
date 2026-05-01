import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { MonetizationForm } from "./MonetizationForm";

export default async function MonetizationSettingsPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
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
  const activeMembers = await prisma.membership.count({
    where: { marketplaceId: mp.id, status: "ACTIVE" },
  });

  return (
    <MonetizationForm
      slug={params.slug}
      initial={{
        isPaid: mp.isPaid,
        monthlyPriceCents: mp.monthlyPriceCents,
        annualPriceCents: mp.annualPriceCents,
        activeMembers,
      }}
    />
  );
}
