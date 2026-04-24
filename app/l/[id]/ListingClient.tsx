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
      toast.error("Couldn't update save.");
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
        toast.success(status === "SOLD" ? "Marked as sold." : "Listing closed.");
        setListing((l) => ({ ...l, status }));
        setStatusConfirm(null);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Couldn't update listing.");
      }
    } finally {
      setStatusBusy(false);
    }
  }

  async function deleteListing() {
    if (!confirm("Delete this listing? This can't be undone.")) return;
    const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Listing deleted.");
      router.push(`/m/${props.marketplace.slug}/feed`);
    } else {
      toast.error("Couldn't delete listing.");
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/l/${listing.id}`);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy link.");
    }
  }

  return (
    <>
      {/* Locked state banner */}
      {isLocked && (
        <div className="mb-5 rounded-[12px] border border-line bg-bg-panel px-4 py-3 flex items-center gap-2.5 text-[13px] text-ink-soft" data-testid="listing-locked-banner">
          <Lock size={14} className="flex-none" />
          {isSold ? "This listing has been marked sold."
            : isClosed ? "This listing is closed."
            : "This listing is under review."}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        {/* LEFT: gallery + details */}
        <div className="space-y-6">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[4/3] bg-bg-panel rounded-[14px] overflow-hidden">
              {listing.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.images[activeImage]}
                  alt={listing.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  data-testid={`listing-image-${activeImage}`}
                />
              ) : (
                <div
                  className="absolute inset-0 grid place-items-center text-muted text-[13px]"
                  style={{ background: "linear-gradient(135deg, var(--blue-softer), var(--bg-panel))" }}
                >
                  No image
                </div>
              )}
            </div>

            {listing.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {listing.images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "relative aspect-square bg-bg-panel rounded-[10px] overflow-hidden border-2 transition-colors",
                      i === activeImage ? "border-blue" : "border-transparent hover:border-line",
                    )}
                    data-testid={`listing-image-thumb-${i}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <section>
              <h2 className="text-[15px] font-semibold mb-2.5">Description</h2>
              <p
                className="text-[15px] text-ink-soft leading-[1.65] whitespace-pre-line"
                data-testid="listing-description"
              >
                {listing.description}
              </p>
            </section>
          )}

          {/* Schema values */}
          {props.schemaFields.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold mb-3">Details</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 bg-surface border border-line rounded-[12px] divide-y sm:divide-y-0 sm:divide-x divide-line-soft overflow-hidden">
                {props.schemaFields
                  .filter((f) => f.type !== "IMAGE")
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
          )}

          {/* Bid history */}
          {isAuction && (
            <section>
              <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
                <Gavel size={14} /> Bid history
                <span className="text-[12px] text-muted font-normal">({props.bidCount})</span>
              </h2>
              {bids.length === 0 ? (
                <div className="bg-surface border border-line rounded-[12px] px-4 py-6 text-center text-[13px] text-muted">
                  No bids yet. Be the first.
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
                          {b.isMine ? "You" : b.user.displayName ?? "Member"}
                        </span>
                        {i === 0 && <Badge variant="blue">Top bid</Badge>}
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
        <aside className="space-y-4">
          <div className="bg-surface border border-line rounded-[14px] p-5 space-y-4">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isAuction && <Badge variant="auction"><Gavel size={10} /> Auction</Badge>}
                {isISO && <Badge variant="iso">In search of</Badge>}
                {isFixed && <Badge variant="neutral">Fixed price</Badge>}
                {isSold && <Badge variant="approved">Sold</Badge>}
                {isClosed && <Badge variant="rejected">Closed</Badge>}
              </div>
              <h1
                className="serif leading-[1.1] tracking-[-0.01em]"
                style={{ fontWeight: 400, fontSize: 30, fontFamily: '"Instrument Serif", serif' }}
                data-testid="listing-title"
              >
                {listing.title}
              </h1>
              <p className="text-[12px] text-muted mt-1.5 flex items-center gap-3">
                <Link href={`/m/${props.marketplace.slug}/feed`} className="hover:text-ink">
                  {props.marketplace.name}
                </Link>
                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                <span className="inline-flex items-center gap-1"><Eye size={11} /> {listing.views}</span>
                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                <span>{timeAgo(listing.createdAt)}</span>
              </p>
            </div>

            {/* Price */}
            {isFixed && (
              <div>
                <div className="text-[11px] mono uppercase tracking-[0.12em] text-muted mb-1">Price</div>
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
                      {bids.length > 0 ? "Current bid" : "Starting bid"}
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
                      {auctionEnded ? "Ended" : "Ends in"}
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
                    Reserve {reserveMet ? "met" : "not met"}
                  </div>
                )}

                {props.marketplace.antiSnipe && (
                  <div className="text-[11px] text-muted">Anti-snipe: bids in the final 5 min extend the clock.</div>
                )}
              </div>
            )}

            {isISO && (
              <div>
                <div className="text-[11px] mono uppercase tracking-[0.12em] text-muted mb-1">Budget</div>
                <div className="text-[22px] font-semibold tracking-[-0.02em] tabular-nums">
                  {listing.priceCents ? `Up to ${formatCents(listing.priceCents, listing.currency)}` : "Open"}
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
                  <Gavel size={16} /> Place a bid
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
                  Message seller
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
                  Message seller
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
                  Offer a match
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
                  {isSaved ? "Saved" : "Save"}
                  <span className="text-[11px] text-muted ml-0.5">· {saveCount}</span>
                </Button>
                <Button variant="secondary" onClick={copyShareLink} className="gap-1.5" data-testid="listing-share">
                  <Share2 size={15} /> Share
                </Button>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="secondary" size="icon" aria-label="More" data-testid="listing-menu">
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
                          {/* Edit listing is hidden for V1 — /l/[id]/edit
                              route isn't built yet, so the link was going
                              to a 404 (SHK-047). We'll surface it again
                              once the edit page ships. */}
                          <DropdownMenu.Item
                            onSelect={(e) => {
                              e.preventDefault();
                              setStatusConfirm("SOLD");
                            }}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px] cursor-pointer"
                            data-testid="listing-sold"
                          >
                            <CheckCircle2 size={14} /> Mark as sold
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onSelect={(e) => {
                              e.preventDefault();
                              setStatusConfirm("CLOSED");
                            }}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px] cursor-pointer"
                            data-testid="listing-close"
                          >
                            <XCircle size={14} /> Close listing
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
                          <Trash2 size={14} /> Delete
                        </DropdownMenu.Item>
                      )}
                      {!props.isSeller && props.isAuthed && (
                        <DropdownMenu.Item
                          onSelect={() => setReportOpen(true)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] hover:bg-hover outline-none text-[14px] cursor-pointer"
                          data-testid="report-listing"
                        >
                          <Flag size={14} /> Report
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
              Listed by
            </div>
            <div className="flex items-start gap-3">
              <Avatar src={props.seller.image} name={props.seller.displayName} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[15px] font-semibold truncate" data-testid="seller-name">
                    {props.seller.displayName}
                  </div>
                  {props.seller.verifiedProviders.length > 0 && (
                    <CheckCircle2 size={14} className="text-blue flex-none" aria-label="Verified" />
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
              {statusConfirm === "SOLD" ? "Mark as sold?" : "Close listing?"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-[13px] text-ink-soft">
              {statusConfirm === "SOLD"
                ? "Buyers will no longer be able to contact or purchase this listing."
                : "The listing is taken offline. You can delete it later if needed."}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setStatusConfirm(null)}
              disabled={statusBusy}
            >
              Cancel
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
                ? "Updating…"
                : statusConfirm === "SOLD"
                  ? "Mark as sold"
                  : "Close listing"}
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
  if (done) return <span className="text-[18px] font-semibold text-danger" data-testid="auction-countdown">Ended</span>;

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
        setError(data.error ?? "Couldn't place bid.");
        return;
      }
      toast.success("Bid placed.");
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
          <DialogTitle>Place a bid</DialogTitle>
          <DialogDescription>
            Minimum bid: <span className="tabular-nums">{formatCents(minNextCents, currency)}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div>
            <Label htmlFor="bid-input" required>
              Your bid
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
              <Input
                id="bid-input"
                type="number"
                min={(minNextCents / 100).toString()}
                step="1"
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
            Bids are binding. If you win, you're committed to the price.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading} data-testid="submit-bid">
            {loading ? "Placing…" : "Place bid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const REPORT_REASONS: { value: "SPAM" | "MISLEADING" | "PROHIBITED" | "DUPLICATE" | "OTHER"; label: string }[] = [
  { value: "SPAM", label: "Spam" },
  { value: "MISLEADING", label: "Misleading or inaccurate" },
  { value: "PROHIBITED", label: "Prohibited item" },
  { value: "DUPLICATE", label: "Duplicate listing" },
  { value: "OTHER", label: "Something else" },
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
      toast.success("Thanks — the team will review it.");
      onOpenChange(false);
      setDetail("");
    } catch {
      toast.error("Couldn't submit report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width={480}>
        <DialogHeader>
          <DialogTitle>Report this listing</DialogTitle>
          <DialogDescription>Moderators will review reports within 24 hours.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div>
            <Label>Reason</Label>
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
            <Label htmlFor="report-detail">Details (optional)</Label>
            <Textarea
              id="report-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Add any context that helps us evaluate this listing."
              data-testid="report-detail"
              maxLength={500}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading} data-testid="submit-report">
            {loading ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
