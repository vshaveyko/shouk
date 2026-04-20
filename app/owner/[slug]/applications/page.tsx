import { redirect } from "next/navigation";
import { requireOwnerOf } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ApplicationsList } from "./ApplicationsList";

export const dynamic = "force-dynamic";

export default async function ApplicationsQueuePage({
  params,
}: {
  params: { slug: string };
}) {
  const { marketplace } = await requireOwnerOf(params.slug);

  // If there's a pending application, redirect to the detail route so the
  // URL matches the rendered structure. Keeps the component tree stable when
  // a user later navigates between queue rows (which would otherwise swap
  // wrappers and remount any open action dialog).
  const first = await prisma.application.findFirst({
    where: { marketplaceId: marketplace.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (first) {
    redirect(`/owner/${params.slug}/applications/${first.id}`);
  }

  return (
    <>
      <ApplicationsList
        slug={params.slug}
        rows={[]}
        selectedId={undefined}
        totalRequiredVerifications={marketplace.requiredVerifications.length}
      />
      <section className="flex-1 min-w-0 bg-bg-soft">
        <div className="empty-state">
          Queue is clear — new applications will appear here.
        </div>
      </section>
    </>
  );
}
