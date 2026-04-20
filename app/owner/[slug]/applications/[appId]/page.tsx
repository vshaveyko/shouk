import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ApplicationsList } from "../ApplicationsList";
import { ApplicationDetail } from "./ApplicationDetail";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: { slug: string; appId: string };
}) {
  const { marketplace } = await requireOwnerOf(params.slug);

  const apps = await prisma.application.findMany({
    where: { marketplaceId: marketplace.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          name: true,
          email: true,
          image: true,
          verifiedAccounts: { select: { provider: true } },
        },
      },
    },
  });

  const rows = apps.map((a) => ({
    id: a.id,
    createdAt: a.createdAt.toISOString(),
    userName: a.user.displayName ?? a.user.name ?? a.user.email ?? "Applicant",
    userImage: a.user.image,
    verifiedProviders: a.user.verifiedAccounts.map((v) => v.provider),
  }));

  return (
    <>
      <ApplicationsList
        slug={params.slug}
        rows={rows}
        selectedId={params.appId}
      />
      <section className="flex-1 min-w-0 bg-bg-soft">
        <ApplicationDetail slug={params.slug} appId={params.appId} />
      </section>
    </>
  );
}
