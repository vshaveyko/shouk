import { redirect } from "next/navigation";
import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ApplicationsList } from "./ApplicationsList";
import { QueueControls } from "./QueueControls";
import {
  applyInMemoryFilters,
  buildWhere,
  fetchQueueCounts,
  orderByForSort,
  parseQueueFilters,
  serializeFilters,
} from "./filters";

export const dynamic = "force-dynamic";

export default async function ApplicationsQueuePage({
  params,
  searchParams,
}: {
  params: { slug: string };
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
            displayName: true,
            name: true,
            email: true,
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

  // If any application matches, stay in the detail view so the workflow keeps
  // working: redirect to the first match while preserving filter params.
  if (filtered.length > 0) {
    redirect(
      `/owner/${params.slug}/applications/${filtered[0].id}${serializeFilters(filters)}`,
    );
  }

  const totalRequiredVerifications = marketplace.requiredVerifications.length;

  return (
    <>
      <QueueControls slug={params.slug} counts={counts} filters={filters} />
      <div className="queue-split">
        <ApplicationsList
          slug={params.slug}
          rows={[]}
          selectedId={undefined}
          totalRequiredVerifications={totalRequiredVerifications}
        />
        <section
          className="flex-1 min-w-0 bg-bg-soft"
          data-testid="apps-empty"
        >
          <div className="empty-state">{emptyMessage(filters)}</div>
        </section>
      </div>
    </>
  );
}

function emptyMessage(filters: {
  status: string;
  q: string;
  verif: string;
  sort: string;
}): string {
  if (filters.q) return `No applications match "${filters.q}".`;
  if (filters.verif !== "all") return "No applications match this verification filter.";
  if (filters.status === "PENDING") return "Queue is clear — new applications will appear here.";
  if (filters.status === "APPROVED") return "No approved applications yet.";
  if (filters.status === "REJECTED") return "No rejected applications.";
  return "No applications found.";
}
