import { prisma } from "@/lib/prisma";

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
