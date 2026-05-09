"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Heart,
  Share2,
  Eye,
  Flag,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Gavel,
  Clock,
  Trash2,
  Lock,
  Pencil,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input, Label, Help, Textarea } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { cn, durationUntil, formatCents, timeAgo } from "@/lib/utils";
import { TrackListingView } from "@/components/app/RecentlyViewed";
import { i18n } from '@shipeasy/sdk/client'

type Listing = {
  id: string;
  title: string;
  type: "FIXED" | "AUCTION" | "ISO";
  status: string;
  description: string | null;
  images: string[];
  priceCents: number | null;
  currency: string;
  createdAt: string;
  soldAt: string | null;
  closedAt: string | null;
  views: number;
  auctionStartCents: number | null;
  auctionReserveCents: number | null;
  auctionMinIncrementCents: number | null;
  auctionEndsAt: string | null;
  schemaValues: Record<string, unknown>;
};

type Bid = {
  id: string;
  amountCents: number;
  createdAt: string;
  user: { id: string; displayName: string | null; image: string | null };
  isMine: boolean;
};

type Props = {
  listing: Listing;
  schemaFields: { id: string; name: string; label: string; type: string }[];
  seller: {
    id: string;
    displayName: string;
    image: string | null;
    bio: string | null;
    verifiedProviders: string[];
  };
  marketplace: { id: string; slug: string; name: string; antiSnipe: boolean };
  bids: Bid[];
  saveCount: number;
  bidCount: number;
  isSaved: boolean;
  isSeller: boolean;
  isMarketOwner: boolean;
  isAuthed: boolean;
};

export function ListingClient(props: Props) {
  const router = useRouter();
  const [listing, setListing] = React.useState(props.listing);
  const [bids, setBids] = React.useState(props.bids);
  const [isSaved, setIsSaved] = React.useState(props.isSaved);
  const [saveCount, setSaveCount] = React.useState(props.saveCount);
  const [activeImage, setActiveImage] = React.useState(0);
  const [bidOpen, setBidOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  // SHK-048 / SHK-049: seller confirms Mark-as-sold / Close via a
  // Dialog instead of window.confirm (which was occasionally blocked
  // or misfiring, making the actions feel like no-ops).
  const [statusConfirm, setStatusConfirm] = React.useState<"SOLD" | "CLOSED" | null>(null);
  const [statusBusy, setStatusBusy] = React.useState(false);

  const isAuction = listing.type === "AUCTION";
  const isISO = listing.type === "ISO";
  const isFixed = listing.type === "FIXED";
  const isSold = listing.status === "SOLD";
  const isClosed = listing.status === "CLOSED";
  const isHidden = listing.status === "SHADOW_HIDDEN" || listing.status === "REMOVED";
  const isLocked = isSold || isClosed || isHidden;

  const currentHighCents = bids[0]?.amountCents ?? listing.auctionStartCents ?? 0;
  const increment = listing.auctionMinIncrementCents ?? 100;
  const minNextBid = currentHighCents + increment;

  const auctionEnded =
    isAuction && listing.auctionEndsAt ? new Date(listing.auctionEndsAt).getTime() <= Date.now() : false;

  const reserveMet = listing.auctionReserveCents
    ? currentHighCents >= listing.auctionReserveCents
    : true;

  async function toggleSave() {
    if (!props.isAuthed) {
      router.push(`/signin?callbackUrl=/l/${listing.id}`);
      return;
    }
    setIsSaved((s) => !s);
    setSaveCount((c) => c + (isSaved ? -1 : 1));
    try {
      const res = await fetch(`/api/listings/${listing.id}/save`, { method: "POST" });
      if (!res.ok) throw new Error();
    } catch {
      setIsSaved((s) => !s);
      setSaveCount((c) => c + (isSaved ? 1 : -1));
      toast.error(i18n.t('common.couldntUpdateSave'));
    }
  }

  async function changeStatus(status: "SOLD" | "CLOSED") {
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(status === "SOLD" ? i18n.t('...[id].listingClient.markedAsSold') : i18n.t('...[id].listingClient.listingClosed'));
        setListing((l) => ({ ...l, status }));
        setStatusConfirm(null);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? i18n.t('...[id].listingClient.couldntUpdateListing'));
      }
    } finally {
      setStatusBusy(false);
    }
  }

  async function deleteListing() {
    if (!confirm("Delete this listing? This can't be undone.")) return;
    const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(i18n.t('...[id].listingClient.listingDeleted'));
      router.push(`/m/${props.marketplace.slug}/feed`);
    } else {
      toast.error(i18n.t('...[id].listingClient.couldntDeleteListing'));
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/l/${listing.id}`);
      toast.success(i18n.t('...[id].listingClient.linkCopied'));
    } catch {
      toast.error(i18n.t('...[id].listingClient.couldntCopyLink'));
    }
  }

  const firstImage = (listing.images as string[])[0] ?? null;

  return (
    <>
      <TrackListingView
        id={listing.id}
        title={listing.title}
        priceCents={listing.priceCents}
        currency={listing.currency ?? "USD"}
        image={firstImage}
      />
      {/* Locked state banner */}
      {isLocked && (
        <div className="mb-5 rounded-[12px] border border-line bg-bg-panel px-4 py-3 flex items-center gap-2.5 text-[13px] text-ink-soft" data-testid="listing-locked-banner">
          <Lock size={14} className="flex-none" />
          {isSold ? i18n.t('...[id].listingClient.thisListingHasBeenMarked')
            : isClosed ? i18n.t('...[id].listingClient.thisListingIsClosed')
            : i18n.t('...[id].listingClient.thisListingIsUnderReview')}
        </div>
      )}

      <div className="ld">
        {/* LEFT: gallery + details */}
        <div className="ld-left">
          {/* Gallery */}
          <div className="ld-main-img">
            {listing.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.images[activeImage]}
                alt={listing.title}
                data-testid={`listing-image-${activeImage}`}
              />
            ) : (
              <div
                className="absolute inset-0 grid place-items-center text-muted text-[13px]"
                style={{ background: "linear-gradient(135deg, var(--blue-softer), var(--bg-panel))" }}
              >
                {i18n.t('...[id].listingClient.noImage')}
              </div>
            )}
          </div>

          {listing.images.length > 1 && (
            <div className="ld-thumbs">
              {listing.images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn("ld-thumb", i === activeImage && "on")}
                  data-testid={`listing-image-thumb-${i}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <section>
              <h2 className="text-[15px] font-semibold mb-2.5">{i18n.t('common.description')}</h2>
              <p
                className="text-[15px] text-ink-soft leading-[1.65] whitespace-pre-line"
                data-testid="listing-description"
              >
                {listing.description}
              </p>
            </section>
          )}

          {/* Schema values */}
          {(() => {
            const detailFields = props.schemaFields.filter(
              (f) => f.type !== "IMAGE" && f.name !== "title" && f.name !== "price",
            );
            if (detailFields.length === 0) return null;
            return (
            <section>
              <h2 className="text-[15px] font-semibold mb-3">{i18n.t('common.details')}</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 bg-surface border border-line rounded-[12px] divide-y sm:divide-y-0 sm:divide-x divide-line-soft overflow-hidden">
                {detailFields
                  .map((f) => {
                    const raw = listing.schemaValues[f.name];
                    const val =
                      raw == null || raw === ""
                        ? "—"
                        : Array.isArray(raw)
                          ? (raw as unknown[]).join(", ")
                          : String(raw);
                    return (
                      <div key={f.id} className="px-4 py-3">
                        <dt className="text-[11px] mono uppercase tracking-[0.12em] text-muted">
                          {f.label}
                        </dt>
                        <dd className="text-[14px] text-ink mt-0.5 break-words">{val}</dd>
                      </div>
                    );
                  })}
              </dl>
            </section>
            );
          })()}

          {/* Bid history */}
          {isAuction && (
            <section>
              <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
                <Gavel size={14} /> {i18n.t('...[id].listingClient.bidHistory')}
                <span className="text-[12px] text-muted font-normal">({props.bidCount})</span>
              </h2>
              {bids.length === 0 ? (
                <div className="bg-surface border border-line rounded-[12px] px-4 py-6 text-center text-[13px] text-muted">
                  {i18n.t('...[id].listingClient.noBidsYetBeThe')}
                </div>
              ) : (
                <ul className="bg-surface border border-line rounded-[12px] overflow-hidden divide-y divide-line-soft">
                  {bids.map((b, i) => (
                    <li
                      key={b.id}
                      className={cn(
                        "px-4 py-3 flex items-center gap-3",
                        i === 0 && "bg-blue-softer",
                        b.isMine && "bg-success-soft/40",
                      )}
                    >
                      <Avatar src={b.user.image} name={b.user.displayName ?? "?"} size={28} />
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-[13px] font-medium truncate">
                          {b.isMine ? "You" : b.user.displayName ?? i18n.t('common.member')}
                        </span>
                        {i === 0 && <Badge variant="blue">{i18n.t('...[id].listingClient.topBid')}</Badge>}
                      </div>
                      <div className="text-[14px] font-semibold tabular-nums">
                        {formatCents(b.amountCents, listing.currency)}
                      </div>
                      <div className="text-[11px] text-muted tabular-nums w-[60px] text-right">
                        {timeAgo(b.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* RIGHT: sticky sidebar */}
        <aside className="ld-right">
          <div className="bg-surface border border-line rounded-[14px] p-5 space-y-4">
            {/* Title */}
            <div className="ld-head">
              <div className="breadcrumb">
                <Link href={`/m/${props.marketplace.slug}/feed`}>{props.marketplace.name}</Link>
                <span>·</span>
                {isAuction && <span>{i18n.t('common.auction')}</span>}
                {isISO && <span>{i18n.t('...[id].listingClient.inSearchOf')}</span>}
                {isFixed && <span>{i18n.t('...[id].listingClient.fixedPrice')}</span>}
                {isSold && <span>{i18n.t('...[id].listingClient.sold')}</span>}
                {isClosed && <span>{i18n.t('common.closed')}</span>}
              </div>
              <h1 data-testid="listing-title">{listing.title}</h1>
              <div className="meta">
                <span className="inline-flex items-center gap-1"><Eye size={11} /> {listing.views} views</span>
                <span>·</span>
                <span>{timeAgo(listing.createdAt)}</span>
              </div>
            </div>

            {/* Price */}
            {isFixed && (
              <div>
                <div className="text-[11px] mono uppercase tracking-[0.12em] text-muted mb-1">{i18n.t('common.price')}</div>
                <div
                  className="tabular-nums"
                  style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400, fontSize: 38, lineHeight: 1, letterSpacing: "-0.015em" }}
                  data-testid="listing-price"
                >
                  {formatCents(listing.priceCents, listing.currency)}
                </div>
              </div>
            )}

            {isAuction && (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <div className="text-[11px] mono uppercase tracking-[0.12em] text-muted mb-0.5">
                      {bids.length > 0 ? i18n.t('...[id].listingClient.currentBid') : i18n.t('common.startingBid')}
                    </div>
                    <div
                      className="text-[28px] font-semibold tracking-[-0.02em] tabular-nums"
                      data-testid="listing-price"
                    >
                      {formatCents(currentHighCents, listing.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] mono uppercase tracking-[0.12em] text-muted mb-0.5">
                      {auctionEnded ? i18n.t('...[id].listingClient.ended') : i18n.t('common.endsIn')}
                    </div>
                    <Countdown endsAt={listing.auctionEndsAt} />
                  </div>
                </div>

                {listing.auctionReserveCents != null && (
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[12px] px-2 py-1 rounded-full",
                      reserveMet ? "bg-success-soft text-success" : "bg-warn-soft text-warn",
                    )}
                  >
                    {reserveMet ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {i18n.t('...[id].listingClient.reserve')} {reserveMet ? "met" : i18n.t('...[id].listingClient.notMet')}
                  </div>
                )}

                {props.marketplace.antiSnipe && (
                  <div className="text-[11px] text-muted">{i18n.t('...[id].listingClient.antisnipeBidsInTheFinal')}</div>
                )}
              </div>
            )}

            {isISO && (
              <div>
                <div className="text-[11px] mono uppercase tracking-[0.12em] text-muted mb-1">{i18n.t('common.budget')}</div>
                <div className="text-[22px] font-semibold tracking-[-0.02em] tabular-nums">
                  {listing.priceCents ? i18n.t('...[id].listingClient.upToFormatcentsresult', { formatCentsResult: formatCents(listing.priceCents, listing.currency) }) : i18n.t('common.open')}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-2 pt-1">
              {isAuction && !isLocked && !auctionEnded && !props.isSeller && (
                <Button
                  onClick={() => (props.isAuthed ? setBidOpen(true) : router.push(`/signin?callbackUrl=/l/${listing.id}`))}
                  size="lg"
                  className="w-full gap-2"
                  data-testid="place-bid"
                >
                  <Gavel size={16} /> {i18n.t('...[id].listingClient.placeABid')}
                </Button>
              )}
              {isFixed && !isLocked && !props.isSeller && (
                <Button
                  size="lg"
                  className="w-full"
                  data-testid="message-seller"
                  onClick={() =>
                    props.isAuthed
                      ? router.push(
                          `/m/${props.marketplace.slug}/messages?seller=${props.seller.id}&listing=${listing.id}`,
                        )
                      : router.push(`/signin?callbackUrl=/l/${listing.id}`)
                  }
                >
                  {i18n.t('...[id].listingClient.messageSeller')}
                </Button>
              )}
              {isAuction && !isLocked && !props.isSeller && (
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  data-testid="message-seller"
                  onClick={() =>
                    props.isAuthed
                      ? router.push(
                          `/m/${props.marketplace.slug}/messages?seller=${props.seller.id}&listing=${listing.id}`,
                        )
                      : router.push(`/signin?callbackUrl=/l/${listing.id}`)
                  }
                >
                  {i18n.t('...[id].listingClient.messageSeller')}
                </Button>
              )}
              {isISO && !isLocked && !props.isSeller && (
                <Button
                  size="lg"
                  className="w-full"
                  data-testid="message-seller"
                  onClick={() =>
                    props.isAuthed
                      ? router.push(
                          `/m/${props.marketplace.slug}/messages?seller=${props.seller.id}&listing=${listing.id}`,
                        )
                      : router.push(`/signin?callbackUrl=/l/${listing.id}`)
                  }
                >
                  {i18n.t('...[id].listingClient.offerAMatch')}
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant={isSaved ? "secondary" : "secondary"}
                  onClick={toggleSave}
                  className={cn("flex-1 gap-1.5", isSaved && "text-danger")}
                  data-testid="listing-save"
                >
                  <Heart size={15} fill={isSaved ? "currentColor" : "none"} />
                  {isSaved ? i18n.t('common.saved') : i18n.t('common.save')}
                  <span className="text-[11px] text-muted ml-0.5">· {saveCount}</span>
                </Button>
                <Button variant="secondary" onClick={copyShareLink} className="gap-1.5" data-testid="listing-share">
                  <Share2 size={15} /> {i18n.t('common.share')}
                </Button>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="secondary" size="icon" aria-label={i18n.t('common.more')} data-testid="listing-menu">
                      <MoreHorizontal size={15} />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={6}
                      className="min-w-[200px] p-1.5 bg-surface border border-line rounded-[10px] shadow-lg animate-fade-in-up z-50"
                    >
                      {props.isSeller && !isLocked && (
                        <>
                          <DropdownMenu.Item
                            onSelect={() => router.push(`/l/${listing.id}/edit`)}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px] cursor-pointer"
                            data-testid="listing-edit"
                          >
                            <Pencil size={14} /> {i18n.t('common.editListing')}
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={(e) => {
                              e.preventDefault();
                              setStatusConfirm("SOLD");
                            }}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px] cursor-pointer"
                            data-testid="listing-sold"
                          >
                            <CheckCircle2 size={14} /> {i18n.t('...[id].listingClient.markAsSold')}
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={(e) => {
                              e.preventDefault();
                              setStatusConfirm("CLOSED");
                            }}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px] cursor-pointer"
                            data-testid="listing-close"
                          >
                            <XCircle size={14} /> {i18n.t('...[id].listingClient.closeListing')}
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="h-px bg-line-soft my-1" />
                        </>
                      )}
                      {(props.isSeller || props.isMarketOwner) && (
                        <DropdownMenu.Item
                          onSelect={deleteListing}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px] text-danger cursor-pointer"
                          data-testid="listing-delete"
                        >
                          <Trash2 size={14} /> {i18n.t('common.delete')}
                        </DropdownMenu.Item>
                      )}
                      {!props.isSeller && props.isAuthed && (
                        <DropdownMenu.Item
                          onSelect={() => setReportOpen(true)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px] cursor-pointer"
                          data-testid="report-listing"
                        >
                          <Flag size={14} /> {i18n.t('...[id].listingClient.report')}
                        </DropdownMenu.Item>
                      )}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </div>

          {/* Seller */}
          <div className="bg-surface border border-line rounded-[14px] p-5">
            <div className="text-[11px] mono uppercase tracking-[0.12em] text-muted mb-3">
              {i18n.t('...[id].listingClient.listedBy')}
            </div>
            <div className="flex items-start gap-3">
              <Link href={`/u/${props.seller.id}`}>
                <Avatar src={props.seller.image} name={props.seller.displayName} size={44} />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/u/${props.seller.id}`} className="text-[15px] font-semibold truncate hover:underline" data-testid="seller-name">
                    {props.seller.displayName}
                  </Link>
                  {props.seller.verifiedProviders.length > 0 && (
                    <CheckCircle2 size={14} className="text-blue flex-none" aria-label={i18n.t('common.verified')} />
                  )}
                </div>
                {props.seller.bio && (
                  <p className="text-[12px] text-muted mt-0.5 line-clamp-2">{props.seller.bio}</p>
                )}
                {props.seller.verifiedProviders.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {props.seller.verifiedProviders.map((p) => (
                      <span key={p} className="text-[10px] mono uppercase tracking-[0.1em] bg-blue-softer text-blue-ink px-1.5 py-0.5 rounded">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Place bid modal */}
      <PlaceBidDialog
        open={bidOpen}
        onOpenChange={setBidOpen}
        listingId={listing.id}
        currency={listing.currency}
        minNextCents={minNextBid}
        onBidPlaced={(newBid) => {
          setBids((prev) => [
            {
              id: newBid.id,
              amountCents: newBid.amountCents,
              createdAt: new Date().toISOString(),
              user: { id: "me", displayName: "You", image: null },
              isMine: true,
            },
            ...prev,
          ]);
          router.refresh();
        }}
      />

      {/* Report modal */}
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        listingId={listing.id}
      />

      {/* Seller status-change confirmation (SHK-048 / SHK-049) */}
      <Dialog
        open={statusConfirm !== null}
        onOpenChange={(o) => !o && setStatusConfirm(null)}
      >
        <DialogContent width={420}>
          <DialogHeader>
            <DialogTitle>
              {statusConfirm === "SOLD" ? i18n.t('...[id].listingClient.markAsSold2') : i18n.t('...[id].listingClient.closeListing2')}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-[13px] text-ink-soft">
              {statusConfirm === "SOLD"
                ? i18n.t('...[id].listingClient.buyersWillNoLongerBe')
                : i18n.t('...[id].listingClient.theListingIsTakenOffline')}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setStatusConfirm(null)}
              disabled={statusBusy}
            >
              {i18n.t('common.cancel')}
            </Button>
            <Button
              variant={statusConfirm === "SOLD" ? "primary" : "danger"}
              onClick={() =>
                statusConfirm && changeStatus(statusConfirm)
              }
              disabled={statusBusy}
              data-testid="confirm-status-change"
            >
              {statusBusy
                ? i18n.t('...[id].listingClient.updating')
                : statusConfirm === "SOLD"
                  ? i18n.t('...[id].listingClient.markAsSold')
                  : i18n.t('...[id].listingClient.closeListing')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Countdown({ endsAt }: { endsAt: string | null }) {
  const [, tick] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return <span className="text-[18px] font-semibold tabular-nums">—</span>;
  const { done, days, hours, minutes, seconds } = durationUntil(endsAt);
  if (done) return <span className="text-[18px] font-semibold text-danger" data-testid="auction-countdown">{i18n.t('...[id].listingClient.ended')}</span>;

  const show = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="text-[18px] font-semibold tabular-nums text-ink" data-testid="auction-countdown">
      {days > 0 && <>{days}d </>}
      {show(hours)}:{show(minutes)}:{show(seconds)}
    </span>
  );
}

function PlaceBidDialog({
  open,
  onOpenChange,
  listingId,
  currency,
  minNextCents,
  onBidPlaced,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listingId: string;
  currency: string;
  minNextCents: number;
  onBidPlaced: (bid: { id: string; amountCents: number }) => void;
}) {
  const [amount, setAmount] = React.useState(String((minNextCents / 100).toFixed(2)));
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setAmount(String((minNextCents / 100).toFixed(2)));
      setError(null);
    }
  }, [open, minNextCents]);

  async function submit() {
    setError(null);
    const dollars = parseFloat(amount);
    if (!isFinite(dollars) || dollars <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    const cents = Math.round(dollars * 100);
    if (cents < minNextCents) {
      setError(`Bid must be at least ${formatCents(minNextCents, currency)}.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: cents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? i18n.t('...[id].listingClient.couldntPlaceBid'));
        return;
      }
      toast.success(i18n.t('...[id].listingClient.bidPlaced'));
      onBidPlaced(data);
      onOpenChange(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width={420}>
        <DialogHeader>
          <DialogTitle>{i18n.t('...[id].listingClient.placeABid')}</DialogTitle>
          <DialogDescription>
            {i18n.t('...[id].listingClient.minimumBid')} <span className="tabular-nums">{formatCents(minNextCents, currency)}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div>
            <Label htmlFor="bid-input" required>
              {i18n.t('common.yourBid')}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
              <Input
                id="bid-input"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 tabular-nums"
                data-testid="bid-input"
                autoFocus
              />
            </div>
            {error && <Help error>{error}</Help>}
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => {
              const cents = minNextCents + i * Math.max(100, Math.round(minNextCents * 0.05));
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAmount((cents / 100).toFixed(2))}
                  className="flex-1 h-9 rounded-[8px] border border-line text-[13px] hover:bg-hover tabular-nums"
                >
                  {formatCents(cents, currency)}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted">
            {i18n.t('...[id].listingClient.bidsAreBindingIfYou')}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {i18n.t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={loading} data-testid="submit-bid">
            {loading ? i18n.t('...[id].listingClient.placing') : i18n.t('...[id].listingClient.placeBid')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const REPORT_REASONS: { value: "SPAM" | "MISLEADING" | "PROHIBITED" | "DUPLICATE" | "OTHER"; label: string }[] = [
  { value: "SPAM", label: i18n.t('...[id].listingClient.spam') },
  { value: "MISLEADING", label: i18n.t('...[id].listingClient.misleadingOrInaccurate') },
  { value: "PROHIBITED", label: i18n.t('...[id].listingClient.prohibitedItem') },
  { value: "DUPLICATE", label: i18n.t('...[id].listingClient.duplicateListing') },
  { value: "OTHER", label: i18n.t('...[id].listingClient.somethingElse') },
];

function ReportDialog({
  open,
  onOpenChange,
  listingId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listingId: string;
}) {
  const [reason, setReason] = React.useState<string>("SPAM");
  const [detail, setDetail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, detail: detail || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success(i18n.t('...[id].listingClient.thanksTheTeamWillReview'));
      onOpenChange(false);
      setDetail("");
    } catch {
      toast.error(i18n.t('...[id].listingClient.couldntSubmitReport'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width={480}>
        <DialogHeader>
          <DialogTitle>{i18n.t('...[id].listingClient.reportThisListing')}</DialogTitle>
          <DialogDescription>{i18n.t('...[id].listingClient.moderatorsWillReviewReportsWithin')}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div>
            <Label>{i18n.t('common.reason')}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger data-testid="report-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="report-detail">{i18n.t('...[id].listingClient.detailsOptional')}</Label>
            <Textarea
              id="report-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={i18n.t('...[id].listingClient.addAnyContextThatHelpsPlaceholder')}
              data-testid="report-detail"
              maxLength={500}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {i18n.t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={loading} data-testid="submit-report">
            {loading ? i18n.t('common.submitting') : i18n.t('...[id].listingClient.submitReport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
