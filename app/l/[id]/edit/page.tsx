import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { NewListingForm } from "@/app/m/[slug]/new/NewListingForm";
import { clCss } from "@/app/m/[slug]/new/listingFormCss";

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
    include: {
      marketplace: {
        include: { schemaFields: { where: { archived: false }, orderBy: { order: "asc" } } },
      },
    },
  });
  if (!listing) notFound();
  if (listing.sellerId !== session.user.id) redirect(`/l/${params.id}`);
  if (listing.status !== "ACTIVE") redirect(`/l/${params.id}`);

  const ctx = await getUserContext();
  const unread = await prisma.notification.count({ where: { userId: session.user.id, readAt: null } });

  const fields = listing.marketplace.schemaFields.map((f) => ({
    id: f.id,
    name: f.name,
    label: f.label,
    helpText: f.helpText,
    type: f.type as string,
    required: f.required,
    options: (f.options as string[] | null) ?? null,
    minImages: f.minImages,
    maxImages: f.maxImages,
  }));

  return (
    <div className="min-h-screen bg-bg-soft">
      <Navbar
        user={{
          id: session.user.id,
          name: ctx?.user.displayName ?? session.user.name,
          image: ctx?.user.image ?? session.user.image,
          email: session.user.email,
        }}
        activeMarketplace={{
          id: listing.marketplace.id,
          name: listing.marketplace.name,
          slug: listing.marketplace.slug,
          logoUrl: listing.marketplace.logoUrl,
          primaryColor: listing.marketplace.primaryColor,
        }}
        marketplaces={ctx ? [...ctx.owned, ...ctx.memberships] : []}
        notificationCount={unread}
      />

      <style dangerouslySetInnerHTML={{ __html: clCss }} />
      <div className="cl-wrap">
        <div className="mb-3">
          <Link
            href={`/l/${listing.id}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={14} /> Back to listing
          </Link>
        </div>

        <NewListingForm
          slug={listing.marketplace.slug}
          marketplaceName={listing.marketplace.name}
          primaryColor={listing.marketplace.primaryColor}
          auctionsEnabled={listing.marketplace.auctionsEnabled}
          currency={listing.currency ?? "USD"}
          schemaFields={fields}
          existing={{
            id: listing.id,
            type: listing.type as "FIXED" | "AUCTION" | "ISO",
            title: listing.title,
            description: listing.description,
            priceCents: listing.priceCents,
            images: (listing.images as string[]) ?? [],
            schemaValues: (listing.schemaValues as Record<string, unknown>) ?? {},
          }}
        />
      </div>
    </div>
  );
}
