import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationsClient } from "./NotificationsClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/notifications");
  const { user, memberships, owned } = ctx;

  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      marketplace: { select: { slug: true, name: true, primaryColor: true } },
    },
  });

  const unread = items.filter((n) => !n.readAt).length;
  const active = memberships[0] ?? owned[0] ?? null;

  // Serialize dates to strings so we can pass into a client component.
  const serialized = items.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    preview: n.preview,
    deeplink: n.deeplink,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
    marketplace: n.marketplace
      ? {
          slug: n.marketplace.slug,
          name: n.marketplace.name,
          primaryColor: n.marketplace.primaryColor ?? null,
        }
      : null,
  }));

  return (
    <div className="min-h-screen bg-bg-soft">
      <Navbar
        user={{
          id: user.id,
          name: user.displayName ?? user.name,
          image: user.image,
          email: user.email,
        }}
        activeMarketplace={active}
        marketplaces={[...owned, ...memberships]}
        mode="member"
        notificationCount={unread}
      />

      <main className="max-w-[880px] mx-auto px-6 py-10">
        {serialized.length === 0 ? (
          <div className="bg-surface border border-line rounded-[14px]">
            <EmptyState
              icon={<Bell size={32} />}
              title="No notifications yet"
              description="When there's something to know — an ISO match, a new bid, a membership decision — it'll show up here."
            />
          </div>
        ) : (
          <NotificationsClient initialItems={serialized} initialUnread={unread} />
        )}
      </main>
    </div>
  );
}
