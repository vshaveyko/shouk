import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { prisma } from "@/lib/prisma";
import { Search as SearchIcon } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

// Stub global search. Navbar's search chip points here.
// TODO: unify with server-side search indexing; for now does simple contains lookup
// across marketplaces, listings, users.
const searchCss = `
.search-wrap { max-width: 820px; margin: 0 auto; padding: 28px 24px 60px; }
.search-field-big { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; }
.search-field-big svg { width: 18px; height: 18px; color: var(--muted); flex: none; }
.search-field-big input { border: 0; outline: 0; flex: 1; font-size: 15px; background: transparent; color: var(--ink); }
.search-field-big input::placeholder { color: var(--muted); }
.search-section { margin-bottom: 26px; }
.search-section h2 { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; color: var(--muted); margin-bottom: 10px; }
.search-result { display: flex; gap: 12px; padding: 12px 14px; border: 1px solid var(--line-soft); border-radius: 10px; background: #fff; margin-bottom: 6px; text-decoration: none; color: inherit; }
.search-result:hover { border-color: var(--line); background: var(--hover); }
.search-result .res-thumb { width: 44px; height: 44px; border-radius: 8px; background: var(--bg-panel); display: grid; place-items: center; color: var(--ink-soft); font-weight: 600; font-size: 14px; flex: none; overflow: hidden; }
.search-result .res-thumb img { width: 100%; height: 100%; object-fit: cover; }
.search-result .res-body { flex: 1; min-width: 0; }
.search-result .res-t { font-size: 13.5px; font-weight: 600; letter-spacing: -0.005em; }
.search-result .res-s { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
.search-empty { padding: 60px 24px; text-align: center; color: var(--muted); font-size: 13px; }
`;

export default async function SearchPage(
  props: {
    searchParams?: Promise<{ q?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/search");
  const { user, memberships, owned } = ctx;

  const unread = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  const q = (searchParams?.q ?? "").trim();

  const [marketplaces, listings] = q
    ? await Promise.all([
        prisma.marketplace.findMany({
          where: {
            status: "ACTIVE",
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { tagline: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
          select: { id: true, slug: true, name: true, category: true, primaryColor: true, logoUrl: true },
        }),
        prisma.listing.findMany({
          where: {
            status: "ACTIVE",
            title: { contains: q, mode: "insensitive" },
          },
          take: 10,
          select: {
            id: true,
            title: true,
            priceCents: true,
            currency: true,
            images: true,
            marketplace: { select: { name: true, slug: true } },
          },
        }),
      ])
    : [[], []];

  return (
    <div className="min-h-screen bg-bg-soft">
      <Navbar
        user={{
          id: user.id,
          name: user.displayName ?? user.name,
          image: user.image,
          email: user.email,
        }}
        activeMarketplace={null}
        marketplaces={[...owned, ...memberships]}
        mode="member"
        notificationCount={unread}
      />
      <style dangerouslySetInnerHTML={{ __html: searchCss }} />

      <div className="search-wrap">
        <form className="search-field-big" action="/search" method="get">
          <SearchIcon size={18} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search marketplaces, listings, members…"
            autoFocus
          />
        </form>

        {!q ? (
          <div className="search-empty">
            Type a query to search across marketplaces, listings, and members.
          </div>
        ) : (
          <>
            <section className="search-section">
              <h2>Marketplaces ({marketplaces.length})</h2>
              {marketplaces.length === 0 ? (
                <div className="search-empty" style={{ padding: 20 }}>
                  No marketplaces match.
                </div>
              ) : (
                marketplaces.map((m) => (
                  <Link key={m.id} href={`/m/${m.slug}`} className="search-result">
                    <span
                      className="res-thumb"
                      style={{ background: m.primaryColor ?? "var(--blue)", color: "#fff" }}
                    >
                      {m.logoUrl ? <img src={m.logoUrl} alt="" /> : m.name[0]}
                    </span>
                    <div className="res-body">
                      <div className="res-t">{m.name}</div>
                      <div className="res-s">{m.category}</div>
                    </div>
                  </Link>
                ))
              )}
            </section>

            <section className="search-section">
              <h2>Listings ({listings.length})</h2>
              {listings.length === 0 ? (
                <div className="search-empty" style={{ padding: 20 }}>
                  No listings match.
                </div>
              ) : (
                listings.map((l) => (
                  <Link key={l.id} href={`/l/${l.id}`} className="search-result">
                    <span className="res-thumb">
                      {l.images[0] ? <img src={l.images[0]} alt="" /> : "·"}
                    </span>
                    <div className="res-body">
                      <div className="res-t">{l.title}</div>
                      <div className="res-s">
                        {l.marketplace.name}
                        {l.priceCents != null
                          ? ` · $${(l.priceCents / 100).toLocaleString()}`
                          : ""}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
