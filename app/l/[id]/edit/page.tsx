import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { EditListingForm } from "./EditListingForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({ where: { id: params.id }, select: { title: true } });
  return { title: listing ? `Edit · ${listing.title}` : "Edit listing" };
}

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=/l/${params.id}/edit`);

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { marketplace: { select: { slug: true } } },
  });
  if (!listing) notFound();
  if (listing.sellerId !== session.user.id) redirect(`/l/${params.id}`);
  if (listing.status !== "ACTIVE") redirect(`/l/${params.id}`);

  const ctx = await getUserContext();
  const unread = await prisma.notification.count({ where: { userId: session.user.id, readAt: null } });

  return (
    <div className="min-h-screen bg-bg-soft">
      <Navbar
        user={{ id: session.user.id, name: ctx?.user.displayName ?? session.user.name, image: ctx?.user.image ?? session.user.image, email: session.user.email }}
        activeMarketplace={null}
        marketplaces={ctx ? [...ctx.owned, ...ctx.memberships] : []}
        notificationCount={unread}
      />
      <EditListingForm
        listing={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          priceCents: listing.priceCents,
          currency: listing.currency ?? "USD",
          images: listing.images as string[],
          type: listing.type,
          marketplaceSlug: listing.marketplace.slug,
          schemaValues: (listing.schemaValues as Record<string, unknown>) ?? {},
        }}
      />
    </div>
  );
}
