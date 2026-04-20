import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { NewListingForm } from "./NewListingForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  return { title: mp ? `New listing · ${mp.name}` : "New listing" };
}

export default async function NewListingPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=/m/${params.slug}/new`);

  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    include: {
      schemaFields: { where: { archived: false }, orderBy: { order: "asc" } },
    },
  });
  if (!mp) redirect("/explore");

  const membership = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
  });
  if (!membership || membership.status !== "ACTIVE") {
    redirect(`/m/${mp.slug}`);
  }

  const ctx = await getUserContext();
  const unread = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  const fields = mp.schemaFields.map((f) => ({
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
          id: mp.id,
          name: mp.name,
          slug: mp.slug,
          logoUrl: mp.logoUrl,
          primaryColor: mp.primaryColor,
        }}
        marketplaces={ctx ? [...ctx.owned, ...ctx.memberships] : []}
        notificationCount={unread}
      />

      <main className="max-w-[860px] mx-auto px-6 py-8">
        <div className="mb-5">
          <Link
            href={`/m/${mp.slug}/feed`}
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={14} /> Back to {mp.name}
          </Link>
        </div>

        <header className="mb-6">
          <p className="text-[12px] tracking-[0.14em] uppercase text-blue-ink font-semibold mb-2">
            Create listing
          </p>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">
            List something in <em className="serif italic text-blue-ink">{mp.name}</em>
          </h1>
          <p className="text-[14px] text-muted mt-1.5">
            Use the form below — it's tailored to this community.
          </p>
        </header>

        <NewListingForm
          slug={mp.slug}
          auctionsEnabled={mp.auctionsEnabled}
          currency="USD"
          schemaFields={fields}
        />
      </main>
    </div>
  );
}
