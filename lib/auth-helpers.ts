import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  return session.user;
}

export async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      verifiedAccounts: true,
      memberships: {
        where: { status: "ACTIVE" },
        include: {
          marketplace: {
            select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true, status: true, category: true },
          },
        },
      },
      ownedMarketplaces: {
        where: { status: { in: ["ACTIVE", "DRAFT"] } },
        select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true, status: true, category: true },
      },
    },
  });
  if (!user) return null;

  // Marketplace owners also have an auto-created OWNER Membership (so the
  // usual membership-based queries don't need an `ownerId` special case). For
  // the shell chrome we don't want to show those twice — filter them out of
  // `memberships` so every caller can safely do `[...owned, ...memberships]`
  // without double-listing the user's own marketplaces (SHK-034 / SHK-043).
  const owned = user.ownedMarketplaces;
  const ownedIds = new Set(owned.map((o) => o.id));
  const memberships = user.memberships
    .map((m) => m.marketplace)
    .filter((mp) => !ownedIds.has(mp.id));

  return { user, memberships, owned };
}

export async function requireOwnerOf(slug: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const mp = await prisma.marketplace.findUnique({ where: { slug } });
  if (!mp) redirect("/home");
  if (mp.ownerId !== session.user.id) {
    // Also allow admins/moderators
    const m = await prisma.membership.findUnique({
      where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
    });
    if (!m || (m.role !== "ADMIN" && m.role !== "MODERATOR" && m.role !== "OWNER")) {
      redirect("/home");
    }
  }
  return { marketplace: mp, userId: session.user.id };
}

export async function requireMemberOf(slug: string) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=/m/${slug}`);
  const mp = await prisma.marketplace.findUnique({ where: { slug } });
  if (!mp) redirect("/home");
  const membership = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: session.user.id, marketplaceId: mp.id } },
  });
  return { marketplace: mp, userId: session.user.id, membership };
}
