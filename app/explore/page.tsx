import Link from "next/link";
import { Compass, Search } from "lucide-react";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { BrandLockup } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Explore marketplaces" };

const entryLabels: Record<string, string> = {
  APPLICATION: "Application",
  INVITE: "Invite only",
  REFERRAL: "By referral",
};

export default async function ExplorePage(
  props: {
    searchParams?: Promise<{ q?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const ctx = await getUserContext();
  const user = ctx?.user ?? null;
  const memberships = ctx?.memberships ?? [];
  const owned = ctx?.owned ?? [];
  const active = memberships[0] ?? owned[0] ?? null;

  const q = (searchParams?.q ?? "").trim();

  const unread = user
    ? await prisma.notification.count({ where: { userId: user.id, readAt: null } })
    : 0;

  const marketplaces = await prisma.marketplace.findMany({
    where: {
      status: "ACTIVE",
      entryMethod: { not: "INVITE" },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { tagline: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { memberships: true, listings: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div className="min-h-screen bg-bg-soft">
      {user ? (
        <Navbar
          user={{ id: user.id, name: user.displayName ?? user.name, image: user.image, email: user.email }}
          activeMarketplace={null}
          marketplaces={[...owned, ...memberships]}
          mode="member"
          notificationCount={unread}
        />
      ) : (
        <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-line">
          <div className="h-full max-w-[1280px] mx-auto px-6 flex items-center justify-between">
            <BrandLockup href="/" size={24} />
            <div className="flex items-center gap-2">
              <Link href="/signin"><Button variant="primary" size="md">Log in</Button></Link>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-[1280px] mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-[12px] tracking-[0.14em] uppercase text-blue-ink font-semibold mb-3">
            Discover
          </div>
          <h1
            className="tracking-[-0.01em] leading-[1.05]"
            style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400, fontSize: 44 }}
          >
            Find communities <em className="text-blue-ink italic">worth joining</em>.
          </h1>
          <p className="text-[14px] text-muted mt-2 max-w-[560px]">
            Small, vetted marketplaces run by people who care — not algorithms. Filter by
            category or search a name.
          </p>
        </div>

        <form className="mb-8 max-w-[520px]" action="/explore" method="get">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, category, or vibe…"
              className="w-full h-[42px] pl-10 pr-4 rounded-[10px] border border-line bg-surface text-[14px] focus-visible:outline-none focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-[var(--blue-softer)]"
              data-testid="explore-search"
            />
          </div>
        </form>

        {marketplaces.length === 0 ? (
          <div className="bg-surface border border-line rounded-[14px]">
            <EmptyState
              icon={<Compass size={32} />}
              title={q ? "No marketplaces match that search." : "Nothing here yet."}
              description={q ? "Try a broader term — or check back later." : "Be the first to start a marketplace."}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="explore-grid">
            {marketplaces.map((m) => (
              <Link
                key={m.id}
                href={`/m/${m.slug}`}
                className="group bg-surface border border-line rounded-[14px] overflow-hidden hover:-translate-y-0.5 hover:shadow transition-all"
                data-testid={`explore-card-${m.slug}`}
              >
                <div
                  className="relative h-[140px]"
                  style={{
                    background: m.coverImageUrl
                      ? `url(${m.coverImageUrl})`
                      : `linear-gradient(135deg, ${m.primaryColor ?? "oklch(0.66 0.16 230)"}, oklch(0.5 0.15 232))`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,.45) 100%)" }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-[11px] font-medium text-ink">
                      {entryLabels[m.entryMethod] ?? m.entryMethod}
                    </span>
                  </div>
                  <h3 className="absolute bottom-3 left-3.5 right-3.5 text-white font-semibold text-[17px] tracking-[-0.015em] truncate">
                    {m.name}
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {m.tagline && (
                    <p className="text-[13px] text-ink-soft line-clamp-2 leading-snug">{m.tagline}</p>
                  )}
                  <div className="flex items-center gap-3 text-[12px] text-muted">
                    <span>{m.category}</span>
                    <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                    <span>{m._count.memberships} {m._count.memberships === 1 ? "member" : "members"}</span>
                    <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                    <span>{m._count.listings} {m._count.listings === 1 ? "listing" : "listings"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
