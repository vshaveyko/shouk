import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { IntegrationsForm } from "./IntegrationsForm";

export default async function IntegrationsSettingsPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireOwnerOf(params.slug);
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      whatsappGroupId: true,
      whatsappGroupName: true,
      whatsappAutoApproval: true,
    },
  });
  if (!mp) return null;

  const [pendingInvites, acceptedInvites] = await Promise.all([
    prisma.phoneInvite.count({ where: { marketplaceId: mp.id, status: "PENDING" } }),
    prisma.phoneInvite.count({ where: { marketplaceId: mp.id, status: "ACCEPTED" } }),
  ]);

  return (
    <IntegrationsForm
      marketplaceId={mp.id}
      initial={{
        whatsappGroupId: mp.whatsappGroupId,
        whatsappGroupName: mp.whatsappGroupName,
        whatsappAutoApproval: mp.whatsappAutoApproval,
      }}
      inviteStats={{ pending: pendingInvites, accepted: acceptedInvites }}
      whatsappEnabled={process.env.WHATSAPP_ENABLED === "true"}
    />
  );
}
