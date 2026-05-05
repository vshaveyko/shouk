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
import { i18n } from '@shipeasy/sdk/client'

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
      if (!res.ok) alert((await res.json().catch(() => null))?.error ?? i18n.t('common.failed'));
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
      if (!res.ok) alert((await res.json().catch(() => null))?.error ?? i18n.t('common.failed'));
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
      if (!res.ok) alert((await res.json().catch(() => null))?.error ?? i18n.t('common.failed'));
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
                aria-label={i18n.t('common.actions')}
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
                    <Check size={14} /> {i18n.t('common.approve')}
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
                    <EyeOff size={14} /> {i18n.t('...listings.listingCard.shadowhide')}
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Item asChild>
                  <Link
                    href={`/l/${listing.id}/edit`}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[13px] cursor-pointer"
                  >
                    <Pencil size={14} /> {i18n.t('common.edit')}
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
                  <Trash2 size={14} /> {i18n.t('common.remove')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      <Dialog open={confirm === "remove"} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent width={420}>
          <DialogHeader>
            <DialogTitle>{i18n.t('...listings.listingCard.removeListing')}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-[13px] text-ink-soft">
              <span className="font-medium">{listing.title}</span> {i18n.t('...listings.listingCard.willBeDeletedFromThe')}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
              {i18n.t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={remove} disabled={busy}>
              {busy ? i18n.t('...listings.listingCard.removing') : i18n.t('common.remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status, reportCount }: { status: string; reportCount?: number }) {
  if (status === "PENDING_REVIEW") return <Badge variant="pending">{i18n.t('common.pending')}</Badge>;
  if (status === "SHADOW_HIDDEN") return <Badge variant="neutral">{i18n.t('...listings.listingCard.hidden')}</Badge>;
  if (status === "REMOVED") return <Badge variant="rejected">{i18n.t('...listings.listingCard.removed')}</Badge>;
  if (status === "ACTIVE" && reportCount && reportCount > 0) {
    return (
      <Badge variant="rejected" className="gap-1">
        <Flag size={10} /> {reportCount}
      </Badge>
    );
  }
  if (status === "ACTIVE") return <Badge variant="approved">{i18n.t('common.active')}</Badge>;
  return <Badge variant="neutral">{status}</Badge>;
}
