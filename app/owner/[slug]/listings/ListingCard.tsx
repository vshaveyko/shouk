"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Check,
  Trash2,
  EyeOff,
  Pencil,
  Flag,
  Package,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/Dialog";
import { formatCents, timeAgo } from "@/lib/utils";

export type ListingCardData = {
  id: string;
  title: string;
  status: string;
  priceCents: number | null;
  currency: string | null;
  image?: string | null;
  createdAt: string;
  sellerName: string;
  sellerImage: string | null;
  reportCount?: number;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [confirm, setConfirm] = React.useState<null | "remove">(null);

  async function approve() {
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (!res.ok) alert((await res.json().catch(() => null))?.error ?? "Failed");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function shadow() {
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "SHADOW_HIDDEN" }),
      });
      if (!res.ok) alert((await res.json().catch(() => null))?.error ?? "Failed");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
      if (!res.ok) alert((await res.json().catch(() => null))?.error ?? "Failed");
      else {
        setConfirm(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="bg-surface border border-line rounded-[12px] overflow-hidden flex flex-col"
      data-testid={`listing-row-${listing.id}`}
    >
      <div className="aspect-[4/3] bg-bg-panel overflow-hidden grid place-items-center">
        {listing.image ? (
          <img
            src={listing.image}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={28} className="text-muted" />
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <Link
            href={`/l/${listing.id}`}
            className="text-[14px] font-semibold hover:underline line-clamp-2 flex-1 min-w-0"
          >
            {listing.title}
          </Link>
          <StatusBadge status={listing.status} reportCount={listing.reportCount} />
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <Avatar
            src={listing.sellerImage}
            name={listing.sellerName}
            size={18}
            className="bg-blue-softer"
          />
          <span className="truncate">{listing.sellerName}</span>
          <span className="tabular-nums">· {timeAgo(listing.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-line-soft">
          <div className="text-[15px] font-semibold tabular-nums">
            {formatCents(listing.priceCents, listing.currency ?? "USD")}
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="h-8 w-8 inline-grid place-items-center rounded-[8px] text-ink-soft hover:bg-hover"
                aria-label="Actions"
                disabled={busy}
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="min-w-[180px] p-1.5 bg-surface border border-line rounded-[10px] shadow-lg z-50"
              >
                {listing.status !== "ACTIVE" && (
                  <DropdownMenu.Item
                    onSelect={(e) => {
                      e.preventDefault();
                      approve();
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[13px] cursor-pointer"
                    data-testid="listing-approve"
                  >
                    <Check size={14} /> Approve
                  </DropdownMenu.Item>
                )}
                {listing.status !== "SHADOW_HIDDEN" && (
                  <DropdownMenu.Item
                    onSelect={(e) => {
                      e.preventDefault();
                      shadow();
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[13px] cursor-pointer"
                    data-testid="listing-shadow"
                  >
                    <EyeOff size={14} /> Shadow-hide
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Item asChild>
                  <Link
                    href={`/l/${listing.id}/edit`}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[13px] cursor-pointer"
                  >
                    <Pencil size={14} /> Edit
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-line-soft my-1" />
                <DropdownMenu.Item
                  onSelect={(e) => {
                    e.preventDefault();
                    setConfirm("remove");
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[13px] cursor-pointer text-danger"
                  data-testid="listing-remove"
                >
                  <Trash2 size={14} /> Remove
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      <Dialog open={confirm === "remove"} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent width={420}>
          <DialogHeader>
            <DialogTitle>Remove listing?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-[13px] text-ink-soft">
              <span className="font-medium">{listing.title}</span> will be deleted from
              the marketplace. This cannot be undone.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove} disabled={busy}>
              {busy ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status, reportCount }: { status: string; reportCount?: number }) {
  if (status === "PENDING_REVIEW") return <Badge variant="pending">Pending</Badge>;
  if (status === "SHADOW_HIDDEN") return <Badge variant="neutral">Hidden</Badge>;
  if (status === "REMOVED") return <Badge variant="rejected">Removed</Badge>;
  if (status === "ACTIVE" && reportCount && reportCount > 0) {
    return (
      <Badge variant="rejected" className="gap-1">
        <Flag size={10} /> {reportCount}
      </Badge>
    );
  }
  if (status === "ACTIVE") return <Badge variant="approved">Active</Badge>;
  return <Badge variant="neutral">{status}</Badge>;
}
