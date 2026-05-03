"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  FileText,
  Users,
  Settings,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Counts = {
  applications?: number;
  listings?: number;
  members?: number;
};

export function OwnerSidebar({
  slug,
  counts = {},
}: {
  slug: string;
  counts?: Counts;
}) {
  const pathname = usePathname();
  const base = `/owner/${slug}`;

  const items = [
    { href: `${base}/dashboard`, label: "Admin", icon: LayoutDashboard },
    {
      href: `${base}/applications`,
      label: "Applications",
      icon: UserPlus,
      count: counts.applications,
      urgent: (counts.applications ?? 0) > 0,
    },
    {
      href: `${base}/listings`,
      label: "Listings",
      icon: FileText,
      count: counts.listings,
    },
    {
      href: `${base}/members`,
      label: "Members",
      icon: Users,
      count: counts.members,
    },
  ];
  const mpItems = [
    { href: `${base}/settings`, label: "Settings", icon: Settings },
    { href: `${base}/analytics`, label: "Analytics", icon: LineChart },
  ];

  return (
    <aside
      data-testid="owner-sidebar"
      className="hidden sm:block w-[232px] flex-none border-r border-line bg-surface px-3.5 py-[22px] sticky top-[60px] self-start max-h-[calc(100vh-60px)] overflow-y-auto"
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted px-2.5 pb-2">
        Moderation
      </div>
      <nav className="flex flex-col">
        {items.map((item) => (
          <SideLink
            key={item.href}
            href={item.href}
            label={item.label}
            Icon={item.icon}
            count={item.count}
            urgent={item.urgent}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>
      <div className="h-px bg-line my-2.5 mx-1.5" />
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted px-2.5 pb-2 mt-1.5">
        Marketplace
      </div>
      <nav className="flex flex-col">
        {mpItems.map((item) => (
          <SideLink
            key={item.href}
            href={item.href}
            label={item.label}
            Icon={item.icon}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>
    </aside>
  );
}

function SideLink({
  href,
  label,
  Icon,
  count,
  urgent,
  active,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  count?: number;
  urgent?: boolean;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-[7px] rounded-[7px] text-[13px] font-medium transition-colors mb-px",
        active
          ? "bg-ink text-white"
          : "text-ink-soft hover:bg-bg-soft hover:text-ink",
      )}
    >
      <Icon size={15} className={active ? "text-white" : "text-muted"} />
      <span className="flex-1">{label}</span>
      {typeof count === "number" && count > 0 && (
        <span
          className={cn(
            "text-[11px] font-semibold px-[7px] py-px rounded-full",
            urgent
              ? "bg-danger text-white"
              : active
                ? "bg-white/20 text-white"
                : "bg-bg-soft text-muted",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
