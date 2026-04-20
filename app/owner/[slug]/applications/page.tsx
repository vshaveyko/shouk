import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ApplicationsList } from "./ApplicationsList";
import { ApplicationDetail } from "./[appId]/ApplicationDetail";

export const dynamic = "force-dynamic";

export default async function ApplicationsQueuePage({
  params,
}: {
  params: { slug: string };
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

  const rows = apps.map((a) => {
    const answers = a.answers as Record<string, unknown> | null;
    let excerpt: string | null = null;
    if (answers) {
      for (const v of Object.values(answers)) {
        if (typeof v === "string" && v.length > 20) {
          excerpt = v.length > 160 ? `${v.slice(0, 160).trim()}…` : v;
          break;
        }
      }
    }
    return {
      id: a.id,
      createdAt: a.createdAt.toISOString(),
      userName: a.user.displayName ?? a.user.name ?? a.user.email ?? "Applicant",
      userImage: a.user.image,
      verifiedProviders: a.user.verifiedAccounts.map((v) => v.provider),
      excerpt,
      subtitle: null,
    };
  });

  const firstId = rows[0]?.id;
  const totalRequiredVerifications = marketplace.requiredVerifications.length;

  return (
    <>
      <ApplicationsList
        slug={params.slug}
        rows={rows}
        selectedId={firstId}
        totalRequiredVerifications={totalRequiredVerifications}
      />
      <div className="q-detail">
        {firstId ? (
          <ApplicationDetail slug={params.slug} appId={firstId} />
        ) : (
          <div className="empty-state">
            Queue is clear — new applications will appear here.
          </div>
        )}
      </div>
    </>
  );
}
