"use client";

import * as React from "react";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  preview: string | null;
  deeplink: string | null;
  readAt: string | null;
  createdAt: string;
  marketplace?: {
    slug: string;
    name: string;
    primaryColor: string | null;
  } | null;
};

function timeAgo(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotificationBell({ initialCount = 0 }: { initialCount?: number }) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [count, setCount] = React.useState(initialCount);
  const hasLoadedRef = React.useRef(false);

  // Keep count in sync when the server sends a fresh initialCount (e.g. after
  // a router.refresh() from the full-page notifications view).
  React.useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: NotificationItem[];
        unread: number;
      };
      setItems(data.items.slice(0, 20));
      setCount(data.unread);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setOpen(true);
      hasLoadedRef.current = true;
      void loadItems();
    } else {
      setOpen(false);
      // Mark read ON CLOSE (per spec — not on open).
      const toMark = items.filter((n) => !n.readAt).map((n) => n.id);
      if (toMark.length > 0) {
        const nowIso = new Date().toISOString();
        setItems((prev) =>
          prev.map((n) => (toMark.includes(n.id) ? { ...n, readAt: nowIso } : n)),
        );
        setCount(0);
        void fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: toMark }),
        }).catch(() => {});
      }
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          data-testid="notifications-bell"
          className="h-9 w-9 rounded-[10px] inline-flex items-center justify-center hover:bg-hover text-ink-soft relative"
        >
          <Bell size={18} />
          {count > 0 && (
            <span
              className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-danger text-white text-[10px] font-semibold inline-flex items-center justify-center"
              data-testid="notifications-count"
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          data-testid="notifications-popover"
          className="w-[380px] max-w-[calc(100vw-24px)] bg-surface border border-line rounded-[12px] shadow-lg animate-fade-in-up z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="text-[14px] font-semibold">Notifications</div>
            {count > 0 && (
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-blue-soft text-blue-ink text-[11px] font-semibold">
                {count} unread
              </span>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-muted">Loading…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={22} className="mx-auto text-ink-soft" />
                <div className="mt-2 text-[13px] font-medium">You're all caught up</div>
                <div className="text-[12px] text-muted">Nothing new right now.</div>
              </div>
            ) : (
              <ul className="divide-y divide-line-soft">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "relative px-4 py-3",
                      !n.readAt ? "bg-blue-softer" : "bg-surface",
                    )}
                  >
                    {!n.readAt && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-0 bottom-0 bg-blue"
                        style={{ width: "3px" }}
                      />
                    )}
                    {n.deeplink ? (
                      <Link
                        href={n.deeplink}
                        onClick={() => setOpen(false)}
                        className="block"
                      >
                        <RowBody n={n} />
                      </Link>
                    ) : (
                      <RowBody n={n} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-line px-4 py-2.5 bg-bg-soft">
            <Link
              href="/notifications"
              data-testid="notifications-see-all"
              onClick={() => setOpen(false)}
              className="block text-center text-[13px] font-medium text-blue-ink hover:underline"
            >
              See all notifications
            </Link>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function RowBody({ n }: { n: NotificationItem }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-ink line-clamp-2">{n.title}</div>
        {n.preview && (
          <div className="text-[12px] text-muted line-clamp-2 mt-0.5">{n.preview}</div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-muted mt-1">
          {n.marketplace && (
            <>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: n.marketplace.primaryColor ?? "var(--blue)" }}
              />
              <span>{n.marketplace.name}</span>
              <span>·</span>
            </>
          )}
          <span>{timeAgo(n.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
