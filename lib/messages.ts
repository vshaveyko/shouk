import { prisma } from "@/lib/prisma";

/**
 * Count threads that have at least one message the user hasn't seen yet.
 * Drives the Messages badge in the top nav — independent from the bell/
 * notifications count (SHK-036). Returns 0 for signed-out callers.
 *
 * A thread is "unread" when its lastMessageAt is newer than the user's
 * lastReadAt on their participant row, and the latest activity wasn't the
 * user themselves.
 */
export async function countUnreadThreads(userId: string | null | undefined) {
  if (!userId) return 0;

  const participations = await prisma.threadParticipant.findMany({
    where: { userId },
    select: {
      lastReadAt: true,
      thread: {
        select: {
          lastMessageAt: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { senderId: true },
          },
        },
      },
    },
  });

  return participations.filter((p) => {
    const last = p.thread.messages[0];
    if (!last || last.senderId === userId) return false;
    if (!p.lastReadAt) return true;
    return p.thread.lastMessageAt > p.lastReadAt;
  }).length;
}

/**
 * Find an existing thread between two users in this marketplace (optionally
 * about a specific listing) or create one. Threads are scoped to a
 * marketplace; a (marketplace, listing?, {userA, userB}) tuple dedupes to a
 * single thread so repeated "Message seller" clicks don't spawn duplicates.
 */
export async function findOrCreateThread({
  marketplaceId,
  listingId,
  userIds,
}: {
  marketplaceId: string;
  listingId?: string | null;
  userIds: [string, string];
}) {
  const [a, b] = userIds;
  if (a === b) throw new Error("Cannot create a thread with yourself");

  const existing = await prisma.messageThread.findFirst({
    where: {
      marketplaceId,
      listingId: listingId ?? null,
      AND: [
        { participants: { some: { userId: a } } },
        { participants: { some: { userId: b } } },
      ],
    },
  });
  if (existing) return existing;

  return prisma.messageThread.create({
    data: {
      marketplaceId,
      listingId: listingId ?? null,
      participants: {
        create: [{ userId: a }, { userId: b }],
      },
    },
  });
}
