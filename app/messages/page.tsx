import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { countUnreadThreads } from "@/lib/messages";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

// SHK-059: universal inbox. Lists every thread the user is a participant
// of, across every marketplace, ordered by lastMessageAt desc. Each row
// shows the other participant, the listing the thread is about (when
// scoped), and the marketplace name. Clicking jumps to the existing
// per-marketplace MessagesClient at /m/[slug]/messages?t=<id>.
export default async function UniversalInboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/messages");

  const userId = session.user.id;
  const [ctx, threadsRaw, unreadNotifs, unreadMessages] = await Promise.all([
    getUserContext(),
    prisma.messageThread.findMany({
      where: {
        participants: { some: { userId } },
        messages: { some: {} },
      },
      orderBy: { lastMessageAt: "desc" },
      include: {
        marketplace: { select: { name: true, slug: true, primaryColor: true, logoUrl: true } },
        listing: { select: { id: true, title: true, priceCents: true, currency: true } },
        participants: {
          include: {
            user: { select: { id: true, displayName: true, name: true, image: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, body: true, senderId: true, createdAt: true },
        },
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    countUnreadThreads(userId),
  ]);

  const threads = threadsRaw.map((t) => {
    const other = t.participants.find((p) => p.userId !== userId)?.user;
    const mine = t.participants.find((p) => p.userId === userId);
    const last = t.messages[0];
    const unread =
      !!last &&
      last.senderId !== userId &&
      (!mine?.lastReadAt || last.createdAt > mine.lastReadAt);
    return {
      id: t.id,
      otherName: other?.displayName ?? other?.name ?? "Member",
      otherImage: other?.image ?? null,
      marketplace: t.marketplace,
      listing: t.listing,
      preview: last?.body ?? "",
      lastAt: t.lastMessageAt.toISOString(),
      unread,
    };
  });

  return (
    <div className="min-h-screen bg-bg-soft">
      <Navbar
        user={{
          id: userId,
          name: ctx?.user.displayName ?? session.user.name,
          image: ctx?.user.image ?? session.user.image,
          email: session.user.email,
        }}
        activeMarketplace={null}
        marketplaces={ctx ? [...ctx.owned, ...ctx.memberships] : []}
        mode="member"
        notificationCount={unreadNotifs}
        unreadMessagesCount={unreadMessages}
      />

      <main className="max-w-[920px] mx-auto px-6 py-8">
        <div className="mb-5">
          <h1 className="text-[28px] font-serif font-normal tracking-[-0.01em]">Messages</h1>
          <p className="text-[13px] text-muted mt-1">
            Every conversation across the marketplaces you belong to.
          </p>
        </div>

        {threads.length === 0 ? (
          <div className="bg-surface border border-line rounded-[12px] p-10 text-center">
            <div className="text-[14px] font-medium mb-1">No conversations yet</div>
            <div className="text-[13px] text-muted">
              Message a seller from any listing and the conversation will land here.
            </div>
          </div>
        ) : (
          <ul className="bg-surface border border-line rounded-[12px] divide-y divide-line-soft overflow-hidden">
            {threads.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/m/${t.marketplace.slug}/messages?t=${t.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-hover transition"
                  data-testid="universal-inbox-row"
                >
                  <span
                    className="w-9 h-9 rounded-full grid place-items-center text-white font-semibold text-[12px] overflow-hidden shrink-0"
                    style={{ background: t.marketplace.primaryColor ?? "var(--blue)" }}
                  >
                    {t.otherImage ? (
                      <img src={t.otherImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (t.otherName[0] ?? "?").toUpperCase()
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[14px] font-medium truncate">{t.otherName}</span>
                        {t.unread && (
                          <span className="w-2 h-2 rounded-full bg-danger shrink-0" aria-label="Unread" />
                        )}
                      </div>
                      <span className="text-[11.5px] text-muted shrink-0">
                        {new Date(t.lastAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-[12.5px] text-ink-soft mt-0.5 truncate">
                      <span
                        className="inline-flex items-center gap-1 mr-1.5 px-1.5 py-0.5 rounded-[4px] bg-bg-soft text-[10.5px] font-semibold uppercase tracking-wide"
                        style={{ color: t.marketplace.primaryColor ?? "var(--ink-soft)" }}
                      >
                        {t.marketplace.name}
                      </span>
                      {t.listing ? (
                        <>
                          <span className="text-muted">about</span>{" "}
                          <span className="font-medium">{t.listing.title}</span>
                        </>
                      ) : (
                        <span className="text-muted">Direct message</span>
                      )}
                    </div>
                    <div className="text-[13px] text-ink-soft mt-1 truncate">{t.preview}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
