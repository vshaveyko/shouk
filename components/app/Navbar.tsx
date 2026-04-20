"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Avatar } from "@/components/ui/Avatar";
import { ShouksMark } from "@/components/brand/Logo";
import { NotificationBell } from "@/components/app/NotificationBell";
import { cn } from "@/lib/utils";

type Marketplace = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
};

const navbarCss = `
.shouks-navbar { height: 60px; background: #fff; border-bottom: 1px solid var(--line); display: flex; align-items: center; padding: 0 24px; gap: 20px; position: sticky; top: 0; z-index: 40; }
.shouks-navbar .brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 600; font-size: 16px; letter-spacing: -0.01em; color: var(--ink); }
.shouks-navbar .brand svg { width: 24px; height: 24px; color: var(--ink); }
.shouks-navbar .mp-switcher-btn { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 10px; border-radius: 9px; border: 1px solid var(--line); background: #fff; font-size: 13px; color: var(--ink); cursor: pointer; }
.shouks-navbar .mp-switcher-btn:hover { background: var(--hover); }
.shouks-navbar .mp-switcher-btn .mp-chip { width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 11px; flex: none; overflow: hidden; }
.shouks-navbar .mp-switcher-btn .mp-chip img { width: 100%; height: 100%; object-fit: cover; }
.shouks-navbar .nav-links { display: flex; align-items: center; gap: 2px; margin-left: 4px; }
.shouks-navbar .nav-links a { padding: 7px 11px; border-radius: 7px; font-size: 14px; color: var(--ink-soft); display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
.shouks-navbar .nav-links a:hover { background: var(--hover); color: var(--ink); }
.shouks-navbar .nav-links a.active { color: var(--ink); background: var(--hover); font-weight: 500; }
.shouks-navbar .nav-links .ping { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 999px; background: var(--danger); color: #fff; }
.shouks-navbar .spacer { flex: 1; }
.shouks-navbar .search { width: 300px; height: 36px; border-radius: 9px; background: var(--bg-soft); border: 1px solid var(--line); display: flex; align-items: center; padding: 0 12px; gap: 10px; color: var(--muted); font-size: 13px; cursor: pointer; }
.shouks-navbar .search svg { width: 14px; height: 14px; }
.shouks-navbar .search:hover { background: var(--hover); }
.shouks-navbar .nav-icon { width: 36px; height: 36px; border-radius: 9px; display: grid; place-items: center; color: var(--ink-soft); position: relative; background: transparent; border: 0; cursor: pointer; }
.shouks-navbar .nav-icon:hover { background: var(--hover); color: var(--ink); }
.shouks-navbar .nav-icon .bell-dot { position: absolute; top: 8px; right: 9px; width: 7px; height: 7px; border-radius: 50%; background: var(--danger); border: 2px solid #fff; }
.shouks-navbar .avatar-btn { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 600; font-size: 12px; cursor: pointer; position: relative; background: linear-gradient(135deg, var(--blue), oklch(0.48 0.13 232)); border: 0; overflow: hidden; padding: 0; }
.shouks-navbar .avatar-btn:hover { box-shadow: 0 0 0 3px var(--blue-soft); }
.shouks-navbar .avatar-btn img { width: 100%; height: 100%; object-fit: cover; }

@media (max-width: 720px) {
  .shouks-navbar .search { display: none; }
  .shouks-navbar .nav-links a[data-optional] { display: none; }
}
`;

export function Navbar({
  user,
  activeMarketplace,
  marketplaces,
  mode = "member",
  notificationCount = 0,
}: {
  user: {
    id: string;
    name?: string | null;
    image?: string | null;
    email?: string | null;
  };
  activeMarketplace?: Marketplace | null;
  marketplaces: Marketplace[];
  mode?: "member" | "owner";
  notificationCount?: number;
}) {
  const pathname = usePathname();

  const inMarketplace = !!activeMarketplace;
  const isOwnerMode = mode === "owner";
  const slug = activeMarketplace?.slug ?? "";

  // Messages are marketplace-scoped. Link to the active marketplace when
  // we're already inside one; otherwise fall back to the first marketplace
  // the user belongs to, or the global redirector at /messages.
  const messagesSlug = slug || marketplaces[0]?.slug || "";
  const messagesHref = messagesSlug ? `/m/${messagesSlug}/messages` : "/messages";
  const messagesActive =
    pathname.startsWith("/messages") || /^\/m\/[^/]+\/messages/.test(pathname);

  const links = isOwnerMode && inMarketplace
    ? [
        {
          href: `/owner/${slug}/dashboard`,
          label: "Dashboard",
          active: pathname.startsWith(`/owner/${slug}`),
        },
        {
          href: `/m/${slug}/feed`,
          label: "Browse",
          active:
            pathname.startsWith(`/m/${slug}`) &&
            !pathname.startsWith(`/m/${slug}/messages`),
        },
        {
          href: messagesHref,
          label: "Messages",
          active: messagesActive,
        },
      ]
    : [
        {
          href: "/explore",
          label: "Explore",
          active: pathname.startsWith("/explore"),
        },
        {
          href: messagesHref,
          label: "Messages",
          active: messagesActive,
        },
      ];

  const searchLabel = inMarketplace
    ? "Search this marketplace…"
    : "Search marketplaces, listings…";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: navbarCss }} />
      <header className="shouks-navbar">
        <Link href="/home" className="brand">
          <ShouksMark size={24} />
          <span>Shouks</span>
        </Link>

        <MarketplaceSwitcher
          active={activeMarketplace}
          marketplaces={marketplaces}
          mode={mode}
        />

        {links.length > 0 && (
          <nav className="nav-links" aria-label="Primary">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={l.active ? "active" : ""}
              >
                {l.label}
                {l.label === "Messages" && notificationCount > 0 ? (
                  <span className="ping">{notificationCount}</span>
                ) : null}
              </Link>
            ))}
          </nav>
        )}

        <div className="spacer" />

        <Link href="/search" className="search" aria-label="Search">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span>{searchLabel}</span>
        </Link>

        <NotificationBell initialCount={notificationCount} />

        <UserMenu user={user} />
      </header>
    </>
  );
}

function MarketplaceSwitcher({
  active,
  marketplaces,
  mode,
}: {
  active?: Marketplace | null;
  marketplaces: Marketplace[];
  mode: "member" | "owner";
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="mp-switcher-btn" data-testid="marketplace-switcher">
          {active ? (
            <>
              <span
                className="mp-chip"
                style={{ background: active.primaryColor ?? "var(--blue)" }}
              >
                {active.logoUrl ? (
                  <img src={active.logoUrl} alt="" />
                ) : (
                  active.name[0]
                )}
              </span>
              <span style={{ fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {active.name}
              </span>
            </>
          ) : (
            <span style={{ color: "var(--muted)" }}>Choose a marketplace</span>
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ color: "var(--muted)" }}>
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="min-w-[280px] p-1.5 bg-surface border border-line rounded-[10px] shadow-lg z-50"
        >
          <div className="px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted font-semibold">
            {mode === "owner" ? "My marketplaces" : "My communities"}
          </div>
          {marketplaces.length === 0 ? (
            <div className="px-2.5 py-2 text-[13px] text-muted">
              You haven't joined any marketplaces yet.
            </div>
          ) : (
            marketplaces.map((m) => (
              <DropdownMenu.Item key={m.id} asChild>
                <Link
                  href={mode === "owner" ? `/owner/${m.slug}/dashboard` : `/m/${m.slug}`}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px]"
                >
                  <span
                    className="w-6 h-6 rounded-[6px] grid place-items-center text-white font-semibold text-[11px] overflow-hidden"
                    style={{ background: m.primaryColor ?? "var(--blue)" }}
                  >
                    {m.logoUrl ? (
                      <img src={m.logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      m.name[0]
                    )}
                  </span>
                  <span className="flex-1 truncate">{m.name}</span>
                </Link>
              </DropdownMenu.Item>
            ))
          )}
          <DropdownMenu.Separator className="h-px bg-line-soft my-1" />
          <DropdownMenu.Item asChild>
            <Link href="/explore" className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px] text-blue-ink">
              <span className="w-6 h-6 rounded-[6px] grid place-items-center bg-blue-soft font-semibold text-[12px]">+</span>
              Discover marketplaces
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/owner/create" className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px]">
              <span className="w-6 h-6 rounded-[6px] grid place-items-center bg-ink text-white font-semibold text-[12px]">✦</span>
              Create a marketplace
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function UserMenu({
  user,
}: {
  user: { name?: string | null; image?: string | null; email?: string | null };
}) {
  const initial = (user.name ?? user.email ?? "?")[0]?.toUpperCase() ?? "?";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="avatar-btn" aria-label="Account" data-testid="user-menu">
          {user.image ? <img src={user.image} alt="" /> : initial}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="min-w-[220px] p-1.5 bg-surface border border-line rounded-[10px] shadow-lg z-50"
        >
          <div className="px-2.5 py-2 border-b border-line-soft mb-1">
            <div className="text-[13px] font-medium truncate">{user.name}</div>
            <div className="text-[12px] text-muted truncate">{user.email}</div>
          </div>
          <DropdownMenu.Item asChild>
            <Link href="/profile" className="block px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px]">
              Profile
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/saved" className="block px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px]">
              Saved
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/onboarding/verify" className="block px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px]">
              Verified accounts
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="h-px bg-line-soft my-1" />
          <DropdownMenu.Item asChild>
            <form action="/api/auth/signout" method="post" className="block">
              <button type="submit" className="w-full text-left px-2.5 py-2 rounded-[6px] hover:bg-hover text-[14px] text-danger" data-testid="sign-out">
                Sign out
              </button>
            </form>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
