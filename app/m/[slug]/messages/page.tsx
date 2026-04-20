import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/app/Navbar";
import { findOrCreateThread } from "@/lib/messages";
import { MessagesClient, type ThreadSummary, type MessageItem } from "./MessagesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function MarketplaceMessagesPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { t?: string; seller?: string; listing?: string };
}) {
  const ctx = await getUserContext();
  const destination = `/m/${params.slug}/messages`;
  if (!ctx) redirect(`/signin?callbackUrl=${encodeURIComponent(destination)}`);

  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      primaryColor: true,
      ownerId: true,
    },
  });
  if (!mp) redirect("/home");

  const isOwner = mp.ownerId === ctx.user.id;
  const membership = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId: ctx.user.id, marketplaceId: mp.id } },
  });
  if (!isOwner && membership?.status !== "ACTIVE") {
    redirect(`/m/${params.slug}`);
  }

  // Entry from "Message seller": ?seller=<userId>&listing=<listingId>
  // Find-or-create the thread, then drop query params so refresh doesn't re-run.
  if (searchParams?.seller && searchParams.seller !== ctx.user.id) {
    const recipientOwns = mp.ownerId === searchParams.seller;
    const recipientMembership = await prisma.membership.findUnique({
      where: {
        userId_marketplaceId: { userId: searchParams.seller, marketplaceId: mp.id },
      },
    });
    if (recipientOwns || recipientMembership?.status === "ACTIVE") {
      let listingId: string | null = null;
      if (searchParams.listing) {
        const listing = await prisma.listing.findUnique({
          where: { id: searchParams.listing },
          select: { marketplaceId: true },
        });
        if (listing && listing.marketplaceId === mp.id) {
          listingId = searchParams.listing;
        }
      }
      const thread = await findOrCreateThread({
        marketplaceId: mp.id,
        listingId,
        userIds: [ctx.user.id, searchParams.seller],
      });
      redirect(`/m/${params.slug}/messages?t=${thread.id}`);
    }
  }

  const threadsRaw = await prisma.messageThread.findMany({
    where: {
      marketplaceId: mp.id,
      participants: { some: { userId: ctx.user.id } },
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      listing: {
        select: { id: true, title: true, priceCents: true, currency: true },
      },
      participants: {
        include: {
          user: {
            select: { id: true, displayName: true, name: true, image: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, senderId: true, createdAt: true },
      },
    },
  });

  const threads: ThreadSummary[] = threadsRaw.map((t) => {
    const other = t.participants.find((p) => p.userId !== ctx.user.id)?.user;
    const mine = t.participants.find((p) => p.userId === ctx.user.id);
    const last = t.messages[0];
    const unread =
      !!last &&
      last.senderId !== ctx.user.id &&
      (!mine?.lastReadAt || last.createdAt > mine.lastReadAt);
    return {
      id: t.id,
      otherName: other?.displayName ?? other?.name ?? "Member",
      otherImage: other?.image ?? null,
      listing: t.listing
        ? {
            id: t.listing.id,
            title: t.listing.title,
            priceCents: t.listing.priceCents,
            currency: t.listing.currency ?? "USD",
          }
        : null,
      preview: last?.body ?? "",
      lastAt: t.lastMessageAt.toISOString(),
      unread,
    };
  });

  // Which thread is selected?
  const selectedId =
    (searchParams?.t && threads.find((t) => t.id === searchParams.t)?.id) ??
    threads[0]?.id ??
    null;

  let selectedMessages: MessageItem[] = [];
  if (selectedId) {
    const rows = await prisma.message.findMany({
      where: { threadId: selectedId },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderId: true, body: true, createdAt: true },
    });
    selectedMessages = rows.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      mine: m.senderId === ctx.user.id,
    }));
    // Mark read for the viewer.
    const mine = threadsRaw
      .find((t) => t.id === selectedId)
      ?.participants.find((p) => p.userId === ctx.user.id);
    if (mine) {
      await prisma.threadParticipant.update({
        where: { id: mine.id },
        data: { lastReadAt: new Date() },
      });
    }
  }

  const unreadNotifs = await prisma.notification.count({
    where: { userId: ctx.user.id, readAt: null },
  });

  return (
    <div className="min-h-screen bg-bg-soft">
      <Navbar
        user={{
          id: ctx.user.id,
          name: ctx.user.displayName ?? ctx.user.name,
          image: ctx.user.image,
          email: ctx.user.email,
        }}
        activeMarketplace={{
          id: mp.id,
          name: mp.name,
          slug: mp.slug,
          logoUrl: mp.logoUrl,
          primaryColor: mp.primaryColor,
        }}
        marketplaces={[...ctx.owned, ...ctx.memberships]}
        mode={isOwner ? "owner" : "member"}
        notificationCount={unreadNotifs}
      />

      <MessagesClient
        slug={mp.slug}
        marketplaceName={mp.name}
        currentUserId={ctx.user.id}
        threads={threads}
        selectedId={selectedId}
        selectedMessages={selectedMessages}
      />
    </div>
  );
}
