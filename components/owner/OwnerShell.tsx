import { redirect } from "next/navigation";
import { Navbar } from "@/components/app/Navbar";
import { OwnerSidebar } from "@/components/owner/OwnerSidebar";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { countUnreadThreads } from "@/lib/messages";

/**
 * Server component shared across /owner/[slug]/... pages.
 * Loads the current user, their marketplaces (owned + memberships),
 * renders the Navbar in "owner" mode with the active marketplace selected,
 * and renders the page body.
 */
export async function OwnerShell({
  slug,
  children,
  notificationCount,
}: {
  slug: string;
  children: React.ReactNode;
  notificationCount?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: {
          marketplace: {
            select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true },
          },
        },
      },
      ownedMarketplaces: {
        where: { status: { in: ["ACTIVE", "DRAFT"] } },
        select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true },
      },
    },
  });
  if (!user) redirect("/signin");

  const ownedRaw = user.ownedMarketplaces;
  const ownedIds = new Set(ownedRaw.map((o) => o.id));
  const owned = ownedRaw.map((m) => ({ ...m, isOwner: true }));
  const memberships = user.memberships
    .map((m) => m.marketplace)
    .filter((mp) => !ownedIds.has(mp.id))
    .map((m) => ({ ...m, isOwner: false }));
  const marketplaces = [...owned, ...memberships];
  const active = marketplaces.find((m) => m.slug === slug) ?? null;

  const [unread, unreadMessages] = await Promise.all([
    notificationCount !== undefined
      ? Promise.resolve(notificationCount)
      : prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    countUnreadThreads(user.id),
  ]);

  const counts = active
    ? await (async () => {
        const [applications, listings, members] = await Promise.all([
          prisma.application.count({
            where: { marketplaceId: active.id, status: "PENDING" },
          }),
          prisma.listing.count({
            where: {
              marketplaceId: active.id,
              OR: [
                { status: "PENDING_REVIEW" },
                { status: "SHADOW_HIDDEN" },
                { reports: { some: { resolved: false } } },
              ],
            },
          }),
          prisma.membership.count({
            where: { marketplaceId: active.id, status: "ACTIVE" },
          }),
        ]);
        return { applications, listings, members };
      })()
    : {};

  return (
    <div className="min-h-screen bg-bg-soft flex flex-col">
      <Navbar
        user={{
          id: user.id,
          name: user.displayName ?? user.name,
          image: user.image,
          email: user.email,
        }}
        activeMarketplace={active}
        marketplaces={marketplaces}
        mode="owner"
        notificationCount={unread}
        unreadMessagesCount={unreadMessages}
      />
      <div className="flex flex-1 min-h-0">
        <OwnerSidebar slug={slug} counts={counts} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
