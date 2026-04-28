import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { BrandLockup } from "@/components/brand/Logo";
import { timeAgo, verifyProviders, formatCents } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const u = await prisma.user.findUnique({
    where: { id: params.id },
    select: { displayName: true, name: true },
  });
  return { title: u?.displayName ?? u?.name ?? "Member" };
}

// Ported from Flow 4 seller profile + Flow 6F profile screen.
const profileCss = `
.pf-wrap { max-width: 960px; margin: 0 auto; padding: 28px 24px 60px; }
.pf-hero { display: flex; gap: 22px; align-items: flex-start; padding-bottom: 22px; border-bottom: 1px solid var(--line); margin-bottom: 26px; }
.pf-hero .pf-av { width: 88px; height: 88px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 30px; font-weight: 600; flex: none; background: linear-gradient(135deg, oklch(0.65 0.15 260), oklch(0.45 0.12 260)); overflow: hidden; }
.pf-hero .pf-av img { width: 100%; height: 100%; object-fit: cover; }
.pf-hero h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 34px; letter-spacing: -0.01em; line-height: 1.05; margin: 2px 0 6px; }
.pf-hero .pf-meta { font-size: 13px; color: var(--muted); display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.pf-hero .pf-meta .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--muted); }
.pf-hero .pf-bio { font-size: 14px; color: var(--ink-soft); margin-top: 12px; line-height: 1.55; max-width: 560px; }
.pf-hero .pf-verif { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
.pf-hero .vchip { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: var(--success-soft); color: var(--success); display: inline-flex; align-items: center; gap: 4px; }

.pf-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); margin-bottom: 20px; }
.pf-tabs a { padding: 10px 14px; font-size: 13px; color: var(--muted); font-weight: 500; border-bottom: 2px solid transparent; margin-bottom: -1px; text-decoration: none; }
.pf-tabs a:hover { color: var(--ink); }
.pf-tabs a.on { color: var(--ink); border-bottom-color: var(--ink); font-weight: 600; }

.pf-listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.pf-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; }
.pf-card:hover { border-color: oklch(0.8 0.02 230); box-shadow: var(--shadow); }
.pf-card .p-img { height: 160px; background: linear-gradient(135deg, oklch(0.4 0.08 25), oklch(0.25 0.06 25)); overflow: hidden; }
.pf-card .p-img img { width: 100%; height: 100%; object-fit: cover; }
.pf-card .p-body { padding: 14px; }
.pf-card .p-t { font-size: 13.5px; font-weight: 600; letter-spacing: -0.005em; }
.pf-card .p-p { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 18px; margin-top: 4px; }
.pf-card .p-s { font-size: 11.5px; color: var(--muted); margin-top: 4px; }
.pf-empty { padding: 60px 24px; text-align: center; color: var(--muted); font-size: 13px; background: #fff; border: 1px solid var(--line); border-radius: 12px; }

.pf-section-label { font-size: 10px; color: var(--muted); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px; }
.pf-shared-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.pf-community-card { background: #fff; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; text-decoration: none; color: inherit; display: block; }
.pf-community-card:hover { border-color: oklch(0.8 0.02 230); box-shadow: var(--shadow); }
.pf-community-card .pc-cover { height: 48px; background: linear-gradient(135deg, oklch(0.48 0.2 28), oklch(0.26 0.14 25)); }
.pf-community-card .pc-body { padding: 10px 12px; }
.pf-community-card .pc-name { font-size: 12.5px; font-weight: 600; letter-spacing: -0.005em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const session = await auth();
  const sessionUserId = session?.user?.id;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      verifiedAccounts: { select: { provider: true, handle: true, verifiedAt: true } },
      memberships: {
        where: { status: "ACTIVE" },
        select: { marketplace: { select: { id: true, name: true, slug: true, coverImageUrl: true } } },
      },
      listings: {
        where: { status: { in: ["ACTIVE", "SOLD"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, title: true, images: true, priceCents: true,
          currency: true, status: true, createdAt: true,
          marketplace: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (!user) notFound();

  const ctx = sessionUserId ? await getUserContext() : null;
  const unread = sessionUserId
    ? await prisma.notification.count({ where: { userId: sessionUserId, readAt: null } })
    : 0;

  const displayName = user.displayName ?? user.name ?? "Member";

  // Compute shared communities (marketplaces both users are in)
  const viewerMarketplaceIds = new Set([
    ...(ctx?.owned ?? []).map((m) => m.id),
    ...(ctx?.memberships ?? []).map((m) => m.id),
  ]);
  const sharedCommunities = user.memberships
    .filter((m) => viewerMarketplaceIds.has(m.marketplace.id))
    .map((m) => m.marketplace);
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="min-h-screen bg-bg-soft">
      {sessionUserId && ctx ? (
        <Navbar
          user={{
            id: sessionUserId,
            name: ctx.user.displayName ?? ctx.user.name,
            image: ctx.user.image,
            email: ctx.user.email,
          }}
          activeMarketplace={null}
          marketplaces={[...ctx.owned, ...ctx.memberships]}
          mode="member"
          notificationCount={unread}
        />
      ) : (
        <header className="bg-surface border-b border-line">
          <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
            <BrandLockup href="/" size={22} />
            <Link href="/signin" className="text-[13px] text-ink-soft hover:text-ink">
              Sign in
            </Link>
          </div>
        </header>
      )}
      <style dangerouslySetInnerHTML={{ __html: profileCss }} />

      <div className="pf-wrap">
        <div className="pf-hero">
          <div className="pf-av">
            {user.image ? <img src={user.image} alt="" /> : initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1>{displayName}</h1>
            <div className="pf-meta">
              <span>Joined {timeAgo(user.createdAt)}</span>
              <span className="dot" />
              <span>{user.listings.length} listings</span>
              <span className="dot" />
              <span>{user.verifiedAccounts.length} verified account{user.verifiedAccounts.length === 1 ? "" : "s"}</span>
            </div>
            {user.bio && <p className="pf-bio">{user.bio}</p>}
            {user.verifiedAccounts.length > 0 && (
              <div className="pf-verif">
                {user.verifiedAccounts.map((v) => {
                  const label = verifyProviders.find((p) => p.id === v.provider)?.label ?? v.provider;
                  return (
                    <span key={v.provider} className="vchip">
                      ✓ {label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Shared communities section */}
        {sessionUserId && sessionUserId !== params.id && (
          <div className="mb-8">
            <div className="pf-section-label">Shared communities</div>
            {sharedCommunities.length === 0 ? (
              <div className="pf-empty">No shared communities.</div>
            ) : (
              <div className="pf-shared-grid">
                {sharedCommunities.map((mp) => (
                  <Link key={mp.id} href={`/m/${mp.slug}/feed`} className="pf-community-card">
                    <div
                      className="pc-cover"
                      style={mp.coverImageUrl ? { backgroundImage: `url(${mp.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                    />
                    <div className="pc-body">
                      <div className="pc-name">{mp.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Listings */}
        <div className="pf-section-label">Listings</div>
        {user.listings.length === 0 ? (
          <div className="pf-empty">No listings yet.</div>
        ) : (
          <div className="pf-listings-grid">
            {user.listings.map((l) => (
              <Link key={l.id} href={`/l/${l.id}`} className="pf-card">
                <div className="p-img">
                  {(l.images as string[])[0] && <img src={(l.images as string[])[0]} alt="" />}
                </div>
                <div className="p-body">
                  <div className="p-t">{l.title}</div>
                  <div className="p-p">
                    {l.priceCents != null
                      ? formatCents(l.priceCents, l.currency ?? "USD")
                      : "—"}
                  </div>
                  <div className="p-s">
                    {l.marketplace.name} · {timeAgo(l.createdAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
