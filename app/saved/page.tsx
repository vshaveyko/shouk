import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Bookmark } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatCents, timeAgo, formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved listings" };

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/saved");

  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/saved");

  const unread = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  const saves = await prisma.listingSave.findMany({
    where: { userId: session.user.id },
    include: {
      marketplace: {
        select: { id: true, name: true, slug: true, primaryColor: true, logoUrl: true, category: true },
      },
      listing: {
        include: {
          seller: { select: { id: true, displayName: true, image: true } },
          _count: { select: { bids: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by marketplace
  type SaveItem = (typeof saves)[number];
  const grouped = new Map<
    string,
    {
      marketplace: SaveItem["marketplace"];
      items: SaveItem[];
    }
  >();
  for (const s of saves) {
    const key = s.marketplace.id;
    if (!grouped.has(key)) {
      grouped.set(key, { marketplace: s.marketplace, items: [] });
    }
    grouped.get(key)!.items.push(s);
  }

  const { user, memberships, owned } = ctx;

  return (
    <div className="min-h-screen bg-bg-soft">
      <Navbar
        user={{ id: user.id, name: user.displayName ?? user.name, image: user.image, email: user.email }}
        activeMarketplace={null}
        marketplaces={[...owned, ...memberships]}
        mode="member"
        notificationCount={unread}
      />

      <main className="max-w-[1280px] mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-[12px] tracking-[0.14em] uppercase text-blue-ink font-semibold mb-2">Saved</p>
          <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Your saved listings</h1>
          <p className="text-[14px] text-muted mt-1.5">
            {saves.length === 0
              ? "Nothing saved yet — tap the heart on any listing to park it here."
              : `${saves.length} saved · grouped by marketplace`}
          </p>
        </div>

        {saves.length === 0 ? (
          <div className="bg-surface border border-line rounded-[14px]">
            <EmptyState
              icon={<Bookmark size={32} />}
              title="Nothing saved yet."
              description="Tap the heart on a listing to keep tabs on it."
              action={
                <Link href="/explore">
                  <Button>Browse marketplaces</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-10">
            {Array.from(grouped.values()).map(({ marketplace, items }) => (
              <section key={marketplace.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-[10px] grid place-items-center text-white font-semibold text-[14px] flex-none overflow-hidden"
                      style={{ background: marketplace.primaryColor ?? "var(--blue)" }}
                    >
                      {marketplace.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={marketplace.logoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        marketplace.name[0]
                      )}
                    </span>
                    <div>
                      <h2 className="text-[17px] font-semibold">{marketplace.name}</h2>
                      <div className="text-[12px] text-muted">
                        {marketplace.category} · {items.length} saved
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/m/${marketplace.slug}/feed`}
                    className="text-[13px] text-blue-ink hover:underline"
                  >
                    Visit feed →
                  </Link>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((s) => {
                    const l = s.listing;
                    const hero = l.images[0] ?? null;
                    const isAuction = l.type === "AUCTION";
                    const ending = l.auctionEndsAt ? formatDuration(l.auctionEndsAt) : null;
                    return (
                      <Link
                        key={l.id}
                        href={`/l/${l.id}`}
                        className="group bg-surface border border-line rounded-[14px] overflow-hidden hover:-translate-y-0.5 hover:shadow transition-all"
                        data-testid={`saved-card-${l.id}`}
                      >
                        <div className="relative aspect-[4/3] bg-bg-panel">
                          {hero ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={hero}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            />
                          ) : (
                            <div
                              className="absolute inset-0"
                              style={{ background: "linear-gradient(135deg, var(--blue-softer), var(--bg-panel))" }}
                            />
                          )}
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            {isAuction && (
                              <Badge variant="auction">
                                {ending ? `Live · ${ending}` : "Auction"}
                              </Badge>
                            )}
                            {l.type === "ISO" && <Badge variant="iso">ISO</Badge>}
                          </div>
                          <span
                            className="absolute top-3 right-3 h-8 w-8 rounded-full grid place-items-center bg-white/95 text-danger"
                            aria-label="Saved"
                          >
                            <Heart size={14} fill="currentColor" />
                          </span>
                          {(l.status === "SOLD" || l.status === "CLOSED") && (
                            <div className="absolute inset-0 bg-black/50 grid place-items-center">
                              <span className="text-white text-[13px] font-semibold tracking-[0.05em] uppercase">
                                {l.status}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-1.5">
                          <h3 className="text-[15px] font-semibold line-clamp-2 group-hover:text-blue-ink transition-colors">
                            {l.title}
                          </h3>
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[15px] font-semibold tabular-nums">
                              {l.type === "ISO"
                                ? "Wanted"
                                : formatCents(l.priceCents ?? l.auctionStartCents ?? 0, l.currency ?? "USD")}
                            </div>
                            {isAuction && (
                              <div className="text-[11px] text-muted tabular-nums">
                                {l._count.bids} bids
                              </div>
                            )}
                          </div>
                          <div className="text-[12px] text-muted">
                            {l.seller.displayName ?? "Member"} · {timeAgo(l.createdAt)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
