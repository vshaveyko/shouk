import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { IdentityForm } from "./IdentityForm";

export default async function IdentitySettingsPage({ params }: { params: { slug: string } }) {
  await requireOwnerOf(params.slug);
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      slug: true,
      tagline: true,
      description: true,
      coverImageUrl: true,
      primaryColor: true,
      status: true,
      entryMethod: true,
    },
  });
  if (!mp) return null;

  return <IdentityForm slug={params.slug} initial={mp} />;
}
