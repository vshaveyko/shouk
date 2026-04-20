"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Bell,
  CheckCircle2,
  Clock,
  DollarSign,
  Flag,
  Gavel,
  Search,
  Trophy,
  UserPlus,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  preview: string | null;
  deeplink: string | null;
  readAt: string | null;
  createdAt: string;
  marketplace: { slug: string; name: string; primaryColor: string | null } | null;
};

type TabKey = "all" | "mentions" | "sales" | "iso";

const SALES_KINDS = new Set([
  "LISTING_APPROVED",
  "LISTING_REJECTED",
  "LISTING_FLAGGED",
  "BID_OUTBID",
  "AUCTION_WON",
  "AUCTION_ENDED",
]);
const ISO_KINDS = new Set(["ISO_MATCH", "NEW_LISTING_MATCH"]);
const MENTION_KINDS = new Set(["MENTION"]);

function categoryOf(kind: string): Exclude<TabKey, "all"> | "other" {
  if (MENTION_KINDS.has(kind)) return "mentions";
  if (SALES_KINDS.has(kind)) return "sales";
  if (ISO_KINDS.has(kind)) return "iso";
  return "other";
}

function iconFor(kind: string) {
  const map: Record<string, React.ReactNode> = {
    APPLICATION_SUBMITTED: <UserPlus size={16} />,
    APPLICATION_APPROVED: <CheckCircle2 size={16} />,
    APPLICATION_REJECTED: <XCircle size={16} />,
    APPLICATION_NEEDS_INFO: <Bell size={16} />,
    LISTING_APPROVED: <CheckCircle2 size={16} />,
    LISTING_REJECTED: <XCircle size={16} />,
    LISTING_FLAGGED: <Flag size={16} />,
    BID_OUTBID: <Gavel size={16} />,
    AUCTION_WON: <Trophy size={16} />,
    AUCTION_ENDED: <Clock size={16} />,
    ISO_MATCH: <Search size={16} />,
    NEW_LISTING_MATCH: <Search size={16} />,
    MENTION: <AtSign size={16} />,
    SYSTEM: <Bell size={16} />,
  };
  return map[kind] ?? <Bell size={16} />;
}

function iconTint(kind: string) {
  const cat = categoryOf(kind);
  if (cat === "iso") return "bg-blue-soft text-blue-ink";
  if (cat === "sales") return "bg-success-soft text-success";
  if (cat === "mentions") return "bg-amber-soft text-amber";
  if (kind === "APPLICATION_REJECTED" || kind === "LISTING_REJECTED")
    return "bg-danger-soft text-danger";
  return "bg-bg-panel text-ink-soft";
}

function timeAgo(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type Bucket = "today" | "yesterday" | "week" | "earlier";

function bucketFor(iso: string): Bucket {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  // "Earlier this week" = within last 7 days but before yesterday.
  startOfWeek.setDate(startOfToday.getDate() - 7);

  if (date >= startOfToday) return "today";
  if (date >= startOfYesterday) return "yesterday";
  if (date >= startOfWeek) return "week";
  return "earlier";
}

const BUCKET_LABELS: Record<Bucket, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Earlier this week",
  earlier: "Earlier",
};

export function NotificationsClient({
  initialItems,
  initialUnread,
}: {
  initialItems: NotificationItem[];
  initialUnread: number;
}) {
  const [items, setItems] = React.useState(initialItems);
  const router = useRouter();
  const [tab, setTab] = React.useState<TabKey>("all");
  const [marking, setMarking] = React.useState(false);

  const visible = React.useMemo(() => {
    if (tab === "all") return items;
    return items.filter((n) => categoryOf(n.kind) === tab);
  }, [items, tab]);

  const unreadCount = items.filter((n) => !n.readAt).length;

  const grouped = React.useMemo(() => {
    const byBucket: Record<Bucket, NotificationItem[]> = {
      today: [],
      yesterday: [],
      week: [],
      earlier: [],
    };
    for (const n of visible) {
      byBucket[bucketFor(n.createdAt)].push(n);
    }
    return byBucket;
  }, [visible]);

  async function markAllRead() {
    setMarking(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
        router.refresh();
      }
    } finally {
      setMarking(false);
    }
  }

  const counts = React.useMemo(() => {
    const c = { all: 0, mentions: 0, sales: 0, iso: 0 } as Record<TabKey, number>;
    for (const n of items) {
      if (n.readAt) continue;
      c.all++;
      const cat = categoryOf(n.kind);
      if (cat !== "other") c[cat]++;
    }
    return c;
  }, [items]);

  const bucketOrder: Bucket[] = ["today", "yesterday", "week", "earlier"];

  return (
    <div className="bg-surface border border-line rounded-[14px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <div className="flex items-center gap-2">
          <h1 className="text-[20px] font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center h-[22px] px-2 rounded-full bg-blue-soft text-blue-ink text-[12px] font-semibold">
              {unreadCount} unread
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={markAllRead}
          disabled={marking || unreadCount === 0}
          data-testid="mark-all-read"
        >
          Mark all read
        </Button>
      </div>

      <div
        className="flex items-center gap-1 px-5 border-b border-line"
        role="tablist"
        aria-label="Notification filters"
      >
        <TabButton label="All" count={counts.all} active={tab === "all"} onClick={() => setTab("all")} testId="tab-all" />
        <TabButton label="Mentions" count={counts.mentions} active={tab === "mentions"} onClick={() => setTab("mentions")} testId="tab-mentions" />
        <TabButton label="Sales" count={counts.sales} active={tab === "sales"} onClick={() => setTab("sales")} testId="tab-sales" />
        <TabButton label="ISO" count={counts.iso} active={tab === "iso"} onClick={() => setTab("iso")} testId="tab-iso" />
      </div>

      <div data-testid="notifications-list">
        {visible.length === 0 ? (
          <EmptyState
            icon={<Bell size={24} />}
            title="Nothing here yet"
            description="Switch tabs or check back soon — this is where new activity will appear."
          />
        ) : (
          bucketOrder.map((b) =>
            grouped[b].length === 0 ? null : (
              <section key={b}>
                <div className="px-5 pt-4 pb-2 text-[11px] uppercase tracking-[0.14em] text-muted font-semibold">
                  {BUCKET_LABELS[b]}
                </div>
                <ul className="divide-y divide-line-soft">
                  {grouped[b].map((n) => (
                    <NotificationRow key={n.id} n={n} />
                  ))}
                </ul>
              </section>
            ),
          )
        )}
      </div>
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
  testId,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      data-testid={testId}
      className={cn(
        "relative -mb-px px-3 py-2.5 text-[14px] font-medium border-b-2 border-transparent text-ink-soft hover:text-ink inline-flex items-center gap-1.5 transition-colors",
        active && "text-ink border-blue",
      )}
    >
      {label}
      {count > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[11px] font-semibold",
            active ? "bg-blue text-white" : "bg-bg-panel text-ink-soft",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function NotificationRow({ n }: { n: NotificationItem }) {
  const unread = !n.readAt;
  return (
    <li
      data-testid={`notification-item-${n.id}`}
      className={cn(
        "relative flex items-start gap-3 px-5 py-4 transition-colors",
        unread ? "bg-blue-softer" : "bg-surface hover:bg-hover",
      )}
    >
      {unread && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 bg-blue"
          style={{ width: "3px" }}
        />
      )}
      <span
        className={cn(
          "flex-none grid place-items-center w-9 h-9 rounded-[10px]",
          iconTint(n.kind),
        )}
      >
        {iconFor(n.kind)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-ink truncate">{n.title}</div>
            {n.preview && (
              <div className="text-[13px] text-muted line-clamp-2 mt-0.5">{n.preview}</div>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-[12px] text-muted">
              {n.marketplace && (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{
                      background: n.marketplace.primaryColor ?? "var(--blue)",
                    }}
                  />
                  {n.marketplace.name}
                </span>
              )}
              {n.marketplace && <span>·</span>}
              <span>{timeAgo(n.createdAt)}</span>
            </div>
          </div>
          {n.deeplink && (
            <Link
              href={n.deeplink}
              className="flex-none inline-flex items-center h-8 px-3 rounded-[8px] text-[13px] font-medium text-blue-ink hover:bg-blue-soft transition-colors"
            >
              View
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}
