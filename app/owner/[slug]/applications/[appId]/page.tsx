import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ApplicationsList } from "../ApplicationsList";
import { QueueControls } from "../QueueControls";
import {
  applyInMemoryFilters,
  buildWhere,
  fetchQueueCounts,
  orderByForSort,
  parseQueueFilters,
} from "../filters";
import { ApplicationDetail } from "./ApplicationDetail";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string; appId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { marketplace } = await requireOwnerOf(params.slug);
  const filters = parseQueueFilters(searchParams);

  const [apps, counts] = await Promise.all([
    prisma.application.findMany({
      where: buildWhere(marketplace.id, filters),
      orderBy: orderByForSort(filters.sort),
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
    }),
    fetchQueueCounts(marketplace.id),
  ]);

  const filtered = applyInMemoryFilters(
    apps,
    filters,
    marketplace.requiredVerifications,
  );

  const rows = filtered.map((a) => ({
    id: a.id,
    createdAt: a.createdAt.toISOString(),
    userName: a.user.displayName ?? a.user.name ?? a.user.email ?? "Applicant",
    userImage: a.user.image,
    verifiedProviders: a.user.verifiedAccounts.map((v) => v.provider),
  }));

  const totalRequiredVerifications = marketplace.requiredVerifications.length;

  return (
    <>
      <QueueControls slug={params.slug} counts={counts} filters={filters} />
      <div className="queue-split">
        <ApplicationsList
          slug={params.slug}
          rows={rows}
          selectedId={params.appId}
          totalRequiredVerifications={totalRequiredVerifications}
        />
        <section className="flex-1 min-w-0 bg-bg-soft">
          <ApplicationDetail slug={params.slug} appId={params.appId} />
        </section>
      </div>
    </>
  );
}
