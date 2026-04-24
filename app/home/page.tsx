import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Compass } from "lucide-react";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomeDashboard({
  searchParams,
}: {
  searchParams?: { stay?: string };
}) {
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/home");
  const { user, memberships, owned } = ctx;

  // Owners whose primary identity is "owner" and who already run at least one
  // marketplace should land in their admin shell, not the member home feed —
  // but only for "implicit" visits. `?stay=1` opts out so that clicking the
  // brand/logo from inside the owner shell doesn't trap the user in a
  // same-page redirect loop (SHK-028).
  if (
    searchParams?.stay !== "1" &&
    user.defaultRole === "OWNER" &&
    owned.length > 0
  ) {
    redirect(`/owner/${owned[0].slug}/dashboard`);
  }

  const active = memberships[0] ?? owned[0] ?? null;

  const unread = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  const publicMarketplaces = await prisma.marketplace.findMany({
    where: { status: "ACTIVE" },
    include: { _count: { select: { memberships: true, listings: true } } },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

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
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="text-[13px] text-muted mb-1.5">
              Welcome back, {user.displayName?.split(" ")[0] ?? user.name?.split(" ")[0] ?? "there"}
            </div>
            <h1
              className="tracking-[-0.01em] leading-[1.1]"
              style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400, fontSize: 36 }}
            >
              Your marketplaces
            </h1>
            <p className="text-[13px] text-muted mt-1.5">
              Pick up where you left off, or start something new.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/explore">
              <Button variant="secondary" size="md" className="gap-2">
                <Compass size={16} /> Explore
              </Button>
            </Link>
            <Link href="/owner/create">
              <Button variant="primary" size="md" className="gap-2">
                <Plus size={16} /> Create a marketplace
              </Button>
            </Link>
          </div>
        </div>

        {owned.length === 0 && memberships.length === 0 ? (
          <div className="bg-surface border border-line rounded-[14px]">
            <EmptyState
              icon={<Compass size={36} />}
              title="You haven't joined a marketplace yet."
              description="Find a community that fits you — watches, cards, cars, denim — or stand up your own."
              action={
                <div className="flex gap-2">
                  <Link href="/explore"><Button variant="primary">Explore marketplaces</Button></Link>
                  <Link href="/owner/create"><Button variant="secondary">Create one</Button></Link>
                </div>
              }
            />
          </div>
        ) : (
          <div className="space-y-8">
            {owned.length > 0 && (
              <section>
                <h2 className="text-[18px] font-semibold mb-3.5">You run</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {owned.map((m) => (
                    <MarketplaceTile key={m.id} m={m} href={`/owner/${m.slug}/dashboard`} role="Owner" />
                  ))}
                </div>
              </section>
            )}
            {memberships.length > 0 && (
              <section>
                <h2 className="text-[18px] font-semibold mb-3.5">You're a member of</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {memberships.map((m) => (
                    <MarketplaceTile key={m.id} m={m} href={`/m/${m.slug}`} role="Member" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {publicMarketplaces.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-[22px] font-semibold">Public marketplaces</h2>
                <p className="text-[13px] text-muted mt-1">Open for applications.</p>
              </div>
              <Link href="/explore" className="text-[13px] text-blue-ink hover:underline">See all →</Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicMarketplaces.map((m) => (
                <Link
                  key={m.id}
                  href={`/m/${m.slug}`}
                  className="bg-surface border border-line rounded-[14px] overflow-hidden hover:-translate-y-0.5 hover:shadow transition"
                >
                  <div
                    className="h-[96px]"
                    style={{
                      background: m.coverImageUrl ? `url(${m.coverImageUrl})` : `linear-gradient(135deg, ${m.primaryColor ?? "oklch(0.66 0.16 230)"}, oklch(0.5 0.15 232))`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="p-4 space-y-1.5">
                    <div className="text-[15px] font-semibold truncate">{m.name}</div>
                    <div className="text-[12px] text-muted">{m.category} · {m._count.memberships} members · {m._count.listings} listings</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function MarketplaceTile({
  m,
  href,
  role,
}: {
  m: {
    id: string;
    name: string;
    slug: string;
    category?: string;
    primaryColor?: string | null;
    logoUrl?: string | null;
    status?: string;
  };
  href: string;
  role: string;
}) {
  return (
    <Link
      href={href}
      className="bg-surface border border-line rounded-[14px] overflow-hidden hover:-translate-y-0.5 hover:shadow transition flex flex-col"
      data-testid={`marketplace-tile-${m.slug}`}
    >
      <div
        className="h-[72px] relative"
        style={{
          background: m.primaryColor
            ? `linear-gradient(135deg, ${m.primaryColor}, color-mix(in oklab, ${m.primaryColor} 60%, black))`
            : "linear-gradient(135deg, oklch(0.66 0.16 230), oklch(0.5 0.15 232))",
        }}
      />
      <div className="p-4 flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-[8px] grid place-items-center text-white font-semibold text-[16px] flex-none -mt-9 border-2 border-white shadow-sm"
          style={{ background: m.primaryColor ?? "var(--blue)" }}
        >
          {m.name[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-[14px] font-semibold truncate flex-1">{m.name}</div>
            <span
              className="text-[10px] uppercase tracking-[0.08em] font-semibold px-1.5 py-0.5 rounded"
              style={
                role === "Owner"
                  ? { background: "var(--ink)", color: "#fff" }
                  : { background: "var(--bg-soft)", color: "var(--muted)" }
              }
            >
              {role}
            </span>
          </div>
          <div className="text-[12px] text-muted truncate mt-0.5">{m.category}</div>
        </div>
      </div>
      {m.status === "DRAFT" && (
        <div className="px-4 pb-3 -mt-2">
          <span className="text-[10px] uppercase tracking-[0.1em] text-warn bg-warn-soft px-2 py-1 rounded-full">
            Draft
          </span>
        </div>
      )}
    </Link>
  );
}
