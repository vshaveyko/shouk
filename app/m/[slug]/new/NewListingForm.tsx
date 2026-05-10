"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gavel, Search, Tag, Plus, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Help } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { i18n } from '@shipeasy/sdk/client'

type FieldType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "CURRENCY"
  | "SELECT"
  | "MULTI_SELECT"
  | "DATE"
  | "IMAGE";

type SchemaField = {
  id: string;
  name: string;
  label: string;
  helpText: string | null;
  type: string;
  required: boolean;
  options: string[] | null;
  minImages: number | null;
  maxImages: number | null;
};

type ListingType = "FIXED" | "AUCTION" | "ISO";

type Props = {
  slug: string;
  marketplaceName: string;
  primaryColor: string | null;
  auctionsEnabled: boolean;
  currency: string;
  schemaFields: SchemaField[];
  // When set, the form switches into edit mode: prefills from the
  // existing listing, locks the type toggle (the API rejects type
  // changes), PATCHes the listing instead of POSTing a new one, and
  // routes Cancel back to the listing detail page.
  existing?: {
    id: string;
    type: ListingType;
    title: string;
    description: string | null;
    priceCents: number | null;
    images: string[];
    schemaValues: Record<string, unknown>;
  };
};

const DURATION_PRESETS = [
  { value: "1h", label: i18n.t('...new.newListingForm.1Hour'), ms: 60 * 60 * 1000 },
  { value: "6h", label: i18n.t('common.nHours', { n1: 6 }), ms: 6 * 60 * 60 * 1000 },
  { value: "12h", label: i18n.t('common.nHours', { n1: 12 }), ms: 12 * 60 * 60 * 1000 },
  { value: "24h", label: i18n.t('common.nHours', { n1: 24 }), ms: 24 * 60 * 60 * 1000 },
  { value: "3d", label: i18n.t('common.nDays', { n1: 3 }), ms: 3 * 24 * 60 * 60 * 1000 },
  { value: "7d", label: i18n.t('common.7Days'), ms: 7 * 24 * 60 * 60 * 1000 },
];

export function NewListingForm({
  slug,
  marketplaceName,
  primaryColor,
  auctionsEnabled,
  currency,
  schemaFields,
  existing,
}: Props) {
  const router = useRouter();
  const isEditing = Boolean(existing);

  const [type, setType] = React.useState<ListingType>(existing?.type ?? "FIXED");
  const [title, setTitle] = React.useState(existing?.title ?? "");
  const [description, setDescription] = React.useState(existing?.description ?? "");
  const [priceDollars, setPriceDollars] = React.useState(
    existing && existing.type === "FIXED" && existing.priceCents != null
      ? (existing.priceCents / 100).toFixed(2).replace(/\.00$/, "")
      : "",
  );
  const [budgetDollars, setBudgetDollars] = React.useState(
    existing && existing.type === "ISO" && existing.priceCents != null
      ? (existing.priceCents / 100).toFixed(2).replace(/\.00$/, "")
      : "",
  );
  const [alertFrequency, setAlertFrequency] = React.useState(
    (existing?.schemaValues?._alertFrequency as string) ?? "INSTANT",
  );
  const [schemaValues, setSchemaValues] = React.useState<Record<string, unknown>>(
    existing?.schemaValues ?? {},
  );
  const [imageUrls, setImageUrls] = React.useState<string[]>(
    existing && existing.images.length > 0 ? [...existing.images, ""] : [""],
  );
  const [auctionStart, setAuctionStart] = React.useState("");
  const [auctionReserve, setAuctionReserve] = React.useState("");
  const [auctionIncrement, setAuctionIncrement] = React.useState("50");
  const [duration, setDuration] = React.useState("24h");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const imageField = schemaFields.find((f) => f.type === "IMAGE");
  // Title, description, and price are rendered by the hard-coded "Basics" /
  // "Pricing" sections above. Any schema field with one of those reserved
  // names would render a duplicate input (with a duplicate testid) — filter
  // them out of the schema-driven section.
  const reservedNames = new Set(["title", "description", "price"]);
  const nonImageFields = schemaFields.filter(
    (f) => f.type !== "IMAGE" && !reservedNames.has(f.name),
  );
  const maxImages = imageField?.maxImages ?? 8;

  function addImage() {
    setImageUrls((prev) => (prev.length >= maxImages ? prev : [...prev, ""]));
  }
  function removeImage(idx: number) {
    setImageUrls((prev) => (prev.length === 1 ? [""] : prev.filter((_, i) => i !== idx)));
  }

  function setField(name: string, value: unknown) {
    setSchemaValues((prev) => ({ ...prev, [name]: value }));
  }

  async function submit() {
    setError(null);

    if (!title.trim()) {
      setError("Give the listing a title.");
      return;
    }

    const images = imageUrls.map((s) => s.trim()).filter(Boolean);

    // SHK-071: previously the form rendered a hardcoded watch UI and
    // skipped validating required fields (the seller couldn't fill them).
    // The dynamic schema-field section now renders the marketplace's
    // actual fields, so enforce required-ness for them too.
    for (const f of nonImageFields) {
      if (!f.required) continue;
      const v = schemaValues[f.name];
      if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) {
        setError(`Please fill in "${f.label}".`);
        return;
      }
    }
    if (imageField?.required) {
      const min = imageField.minImages ?? 1;
      if (images.length < min) {
        setError(`At least ${min} image${min === 1 ? "" : "s"} required.`);
        return;
      }
    }

    const body: Record<string, unknown> = {
      title: title.trim(),
      type,
      description: description.trim() || undefined,
      schemaValues: { ...schemaValues, title: title.trim() },
      images,
      currency,
    };

    if (type === "FIXED") {
      const price = parseFloat(priceDollars);
      if (!isFinite(price) || price < 0) {
        setError("Enter a valid price.");
        return;
      }
      body.priceCents = Math.round(price * 100);
      (body.schemaValues as Record<string, unknown>).price = Math.round(price * 100);
    } else if (type === "AUCTION") {
      const start = parseFloat(auctionStart);
      const increment = parseFloat(auctionIncrement);
      if (!isFinite(start) || start < 0) {
        setError("Starting bid is required.");
        return;
      }
      if (!isFinite(increment) || increment <= 0) {
        setError("Minimum increment must be positive.");
        return;
      }
      body.auctionStartCents = Math.round(start * 100);
      body.auctionMinIncrementCents = Math.round(increment * 100);
      const reserve = parseFloat(auctionReserve);
      if (auctionReserve && isFinite(reserve) && reserve > 0) {
        body.auctionReserveCents = Math.round(reserve * 100);
      }
      const preset = DURATION_PRESETS.find((d) => d.value === duration);
      const ms = preset?.ms ?? 24 * 60 * 60 * 1000;
      body.auctionEndsAt = new Date(Date.now() + ms).toISOString();
    } else if (type === "ISO") {
      if (budgetDollars) {
        const budget = parseFloat(budgetDollars);
        if (isFinite(budget) && budget > 0) {
          body.priceCents = Math.round(budget * 100);
        }
      }
      body.schemaValues = { ...(body.schemaValues as object), _alertFrequency: alertFrequency };
    }

    setSubmitting(true);
    try {
      // PATCH only accepts a subset of fields; type and auction config
      // are immutable post-create. Strip them before sending.
      const editBody: Record<string, unknown> = isEditing
        ? {
            title: body.title,
            description: body.description ?? "",
            schemaValues: body.schemaValues,
            images: body.images,
            ...(type === "FIXED" || type === "ISO"
              ? { priceCents: body.priceCents ?? null }
              : {}),
          }
        : body;

      const url = isEditing
        ? `/api/listings/${existing!.id}`
        : `/api/marketplaces/${slug}/listings`;
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editBody),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isEditing ? "Couldn't save listing." : "Couldn't create listing."));
        return;
      }
      toast.success(isEditing ? i18n.t('...new.newListingForm.listingUpdated') : i18n.t('...new.newListingForm.listingCreated'));
      router.push(`/l/${isEditing ? existing!.id : data.id}`);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isISO = type === "ISO";
  const coverImage = imageUrls.find(Boolean) ?? null;
  const previewPrice = isISO
    ? budgetDollars
      ? i18n.t('...new.newListingForm.upToVar0', { var0: Number(budgetDollars).toLocaleString() })
      : i18n.t('common.budgetOpen')
    : priceDollars
      ? i18n.t('...new.newListingForm.var0', { var0: Number(priceDollars).toLocaleString() })
      : "$ —";

  return (
    <div className="cl">
      <div className="cl-body">
        <div className="cl-head">
          <div className="breadcrumb">
            <Link href={`/m/${slug}/feed`}>{marketplaceName}</Link>
            <span>·</span>
            {isEditing ? (
              <>
                <Link href={`/l/${existing!.id}`}>{i18n.t('common.listing')}</Link>
                <span>·</span>
                <span>{i18n.t('common.edit')}</span>
              </>
            ) : (
              <span>{i18n.t('...new.newListingForm.newPost')}</span>
            )}
          </div>
          <h1>{isEditing ? i18n.t('common.editListing') : i18n.t('...new.newListingForm.postToMarketplacename', { marketplaceName })}</h1>
          <p>
            {isEditing
              ? i18n.t('...new.newListingForm.updateYourListingTypeCant')
              : i18n.t('...new.newListingForm.chooseWhatKindOfPost')}
            {!isEditing && <span className="req">*</span>}
            {!isEditing && " are required by this marketplace."}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          data-testid="create-listing-form"
        >
          {/* Mode toggle — Sell vs ISO (Auctions hidden for V1 per SHK-027).
              Locked when editing: the API rejects type changes. */}
          {!isEditing && (
          <div className="mode-toggle" role="tablist" aria-label={i18n.t('...new.newListingForm.postModeAria-label')}>
            <button
              type="button"
              role="tab"
              aria-selected={type === "FIXED"}
              className={`mt-opt${type === "FIXED" ? " on" : ""}`}
              onClick={() => setType("FIXED")}
              data-testid="listing-type-fixed"
            >
              <div className="mt-ic">
                <Tag size={16} />
              </div>
              <div>
                <span className="mt-l">{i18n.t('...new.newListingForm.imSelling')}</span>
                <span className="mt-s">{i18n.t('...new.newListingForm.postSomethingYouHaveAnd')}</span>
              </div>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={type === "ISO"}
              className={`mt-opt${type === "ISO" ? " on" : ""}`}
              onClick={() => setType("ISO")}
              data-testid="listing-type-iso"
            >
              <div className="mt-ic">
                <Search size={16} />
              </div>
              <div>
                <span className="mt-l">{i18n.t('...new.newListingForm.imLookingForIso')}</span>
                <span className="mt-s">{i18n.t('...new.newListingForm.postAWantedAdSellers')}</span>
              </div>
            </button>
          </div>
          )}

          {isISO && (
            <div className="iso-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <div>
                <strong>{i18n.t('...new.newListingForm.wantedPostsArePublic')}</strong> {i18n.t('...new.newListingForm.every')} {marketplaceName} {i18n.t('...new.newListingForm.sellerCanSeeThisAnd')}
              </div>
            </div>
          )}

      {/* Basics */}
      <section className="bg-surface border border-line rounded-[14px] p-5 space-y-4">
        <h2 className="text-[14px] font-semibold">{i18n.t('...new.newListingForm.basics')}</h2>

        <div>
          <Label htmlFor="title" required>{i18n.t('common.title')}</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "ISO" ? i18n.t('...new.newListingForm.wtb1985RolexSubmariner5513') : i18n.t('...new.newListingForm.1989FerrariF40RossoCorsa')}
            maxLength={200}
            data-testid="listing-field-title"
          />
        </div>

        <div>
          <Label htmlFor="description">
            {type === "ISO" ? i18n.t('...new.newListingForm.whatYoureLookingFor') : i18n.t('common.description')}
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "ISO"
                ? i18n.t('...new.newListingForm.conditionYearsSpecificsAnythingThat')
                : i18n.t('...new.newListingForm.historyConditionProvenanceMoreDetail')
            }
            data-testid="listing-field-description"
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-surface border border-line rounded-[14px] p-5 space-y-4">
        <h2 className="text-[14px] font-semibold">
          {type === "AUCTION" ? i18n.t('common.auction') : type === "ISO" ? i18n.t('common.budget') : i18n.t('common.price')}
        </h2>

        {type === "FIXED" && (
          <div>
            <Label htmlFor="price" required>{i18n.t('...new.newListingForm.priceUsd')}</Label>
            <div className="relative max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                className="pl-7 tabular-nums"
                placeholder="0.00"
                data-testid="price-input"
              />
            </div>
          </div>
        )}

        {type === "ISO" && (
          <>
            <div>
              <Label htmlFor="budget">{i18n.t('...new.newListingForm.budgetCeilingOptional')}</Label>
              <div className="relative max-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
                <Input
                  id="budget"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={budgetDollars}
                  onChange={(e) => setBudgetDollars(e.target.value)}
                  className="pl-7 tabular-nums"
                  placeholder="0.00"
                  data-testid="price-input"
                />
              </div>
              <Help>{i18n.t('...new.newListingForm.leaveBlankIfBudgetIs')}</Help>
            </div>
            <div>
              <Label>{i18n.t('...new.newListingForm.alertFrequency')}</Label>
              <div className="max-w-[240px]">
                <Select value={alertFrequency} onValueChange={setAlertFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSTANT">{i18n.t('...new.newListingForm.instant')}</SelectItem>
                    <SelectItem value="DAILY">{i18n.t('...new.newListingForm.dailyDigest')}</SelectItem>
                    <SelectItem value="WEEKLY">{i18n.t('...new.newListingForm.weeklyDigest')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Help>{i18n.t('...new.newListingForm.wellNotifyYouWhenMatches')}</Help>
            </div>
          </>
        )}

        {type === "AUCTION" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="auction-start" required>{i18n.t('common.startingBid')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
                <Input
                  id="auction-start"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={auctionStart}
                  onChange={(e) => setAuctionStart(e.target.value)}
                  className="pl-7 tabular-nums"
                  data-testid="auction-start"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="auction-reserve">{i18n.t('...new.newListingForm.reserveOptional')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
                <Input
                  id="auction-reserve"
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={auctionReserve}
                  onChange={(e) => setAuctionReserve(e.target.value)}
                  className="pl-7 tabular-nums"
                  data-testid="auction-reserve"
                />
              </div>
              <Help>{i18n.t('...new.newListingForm.ifTheTopBidDoesnt')}</Help>
            </div>
            <div>
              <Label htmlFor="auction-increment" required>{i18n.t('...new.newListingForm.minIncrement')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
                <Input
                  id="auction-increment"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={auctionIncrement}
                  onChange={(e) => setAuctionIncrement(e.target.value)}
                  className="pl-7 tabular-nums"
                  data-testid="auction-increment"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="auction-duration" required>{i18n.t('common.duration')}</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger data-testid="auction-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_PRESETS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </section>

      {/* Images */}
      {(type !== "ISO" || imageField) && (
        <section className="bg-surface border border-line rounded-[14px] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold">{imageField?.label || i18n.t('...new.newListingForm.photos')}</h2>
              <p className="text-[12px] text-muted mt-0.5">
                {i18n.t('...new.newListingForm.uploadFromYourDeviceOr')}
                {imageField?.minImages ? i18n.t('...new.newListingForm.atLeastMinimages', { minImages: String(imageField.minImages) }) : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {imageUrls.length < maxImages && (
                <>
                  <label
                    className="inline-flex items-center h-9 px-3 rounded-[9px] border border-line bg-surface hover:bg-hover text-[13px] font-medium cursor-pointer gap-1.5"
                    data-testid="images-upload"
                  >
                    <Plus size={14} /> {i18n.t('common.upload')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length === 0) return;
                        setError(null);
                        try {
                          const uploaded = await Promise.all(
                            files.slice(0, maxImages).map(async (file) => {
                              const res = await fetch("/api/upload", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ contentType: file.type, size: file.size }),
                              });
                              if (!res.ok) {
                                const { error } = await res.json().catch(() => ({}));
                                throw new Error(error ?? i18n.t('...new.newListingForm.uploadFailed'));
                              }
                              const { uploadUrl, publicUrl } = await res.json();
                              await fetch(uploadUrl, {
                                method: "PUT",
                                headers: { "Content-Type": file.type },
                                body: file,
                              });
                              return publicUrl as string;
                            }),
                          );
                          setImageUrls((prev) => {
                            const filtered = prev.filter(Boolean);
                            const combined = [...filtered, ...uploaded].slice(0, maxImages);
                            return combined.length < maxImages ? [...combined, ""] : combined;
                          });
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Couldn't upload image.");
                        } finally {
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                  <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={addImage}>
                    <Plus size={14} /> {i18n.t('...new.newListingForm.addUrl')}
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {imageUrls.map((u, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-[8px] bg-bg-panel flex items-center justify-center text-muted flex-none overflow-hidden">
                  {u ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")} />
                  ) : (
                    <ImageIcon size={14} />
                  )}
                </div>
                <Input
                  type="url"
                  value={u}
                  onChange={(e) =>
                    setImageUrls((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                  }
                  placeholder="https://example.com/photo.jpg"
                  data-testid={`images-input-${i}`}
                />
                {(imageUrls.length > 1 || u) && (
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="h-9 w-9 rounded-[8px] border border-line text-ink-soft hover:bg-hover grid place-items-center flex-none"
                    aria-label={i18n.t('...new.newListingForm.removeImageAria-label')}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <Help>{i18n.t('...new.newListingForm.upTo')} {maxImages} {i18n.t('...new.newListingForm.imagesJpegPngWebp')}</Help>
        </section>
      )}

      {/* SHK-062 / SHK-071: render the marketplace's actual schema fields
          (year, model, condition, era, etc.) instead of the V1 hardcoded
          watch UI. The watch form silently dropped data on every non-
          watches marketplace because the keys it wrote (brand, case_size,
          ...) didn't match the seller's schema; year/condition/etc. then
          showed as "—" on the listing detail page. */}
      {nonImageFields.length > 0 && (
        <section
          className="bg-surface border border-line rounded-[14px] p-5 space-y-5"
          data-testid="watch-details-section"
        >
          <h2 className="text-[14px] font-semibold">{i18n.t('common.details')}</h2>
          <p className="text-[12.5px] text-muted -mt-3">
            {i18n.t('...new.newListingForm.allOptionalFillInWhat')}
          </p>
          {nonImageFields.map((f) => (
            <SchemaFieldInput
              key={f.id}
              field={f}
              value={schemaValues[f.name]}
              onChange={(val) => setField(f.name, val)}
            />
          ))}
        </section>
      )}

      {error && (
        <div className="rounded-[10px] border border-danger/30 bg-danger-soft p-3 text-[13px] text-danger">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            router.push(isEditing ? `/l/${existing!.id}` : `/m/${slug}/feed`)
          }
        >
          {i18n.t('common.cancel')}
        </Button>
        <Button type="submit" disabled={submitting} data-testid="submit-listing">
          {submitting
            ? isEditing ? i18n.t('common.saving') : i18n.t('common.publishing')
            : isEditing ? i18n.t('common.saveChanges') : i18n.t('...new.newListingForm.publishListing')}
        </Button>
      </div>
        </form>
      </div>

      <aside className="cl-right" aria-label={i18n.t('...new.newListingForm.livePreviewAria-label')}>
        <div className="preview">
          <div className="preview-hd">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {i18n.t('...new.newListingForm.livePreviewAria-label')}
          </div>
          <div
            className="preview-img"
            style={
              coverImage
                ? { backgroundImage: `url(${coverImage})` }
                : {
                    background: `linear-gradient(135deg, ${primaryColor ?? "oklch(0.5 0.18 25)"}, color-mix(in oklab, ${primaryColor ?? "oklch(0.5 0.18 25)"} 40%, black))`,
                  }
            }
          />
          <div className="preview-body">
            {isISO && <div className="iso-preview-tag">{i18n.t('common.wantedIso')}</div>}
            <div className="p-t">{title.trim() || (isISO ? "What you're looking for" : "Your listing title")}</div>
            <div className="p-p">{previewPrice}</div>
            {Object.entries(schemaValues).slice(0, 4).map(([k, v]) => {
              const val = Array.isArray(v) ? v.join(", ") : String(v ?? "");
              if (!val) return null;
              const field = schemaFields.find((f) => f.name === k);
              if (!field) return null;
              return (
                <div className="p-spec" key={k}>
                  <div className="k">{field.label}</div>
                  <div>{val}</div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

function TypeCard({
  active,
  onSelect,
  icon,
  title,
  desc,
  disabled,
  disabledHint,
  testid,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  disabled?: boolean;
  disabledHint?: string;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onSelect();
      }}
      disabled={disabled}
      className={cn(
        "relative text-left p-4 rounded-[12px] border transition-all",
        active
          ? "border-blue bg-blue-softer shadow-sm"
          : "border-line bg-surface hover:bg-hover",
        disabled && "opacity-50 cursor-not-allowed hover:bg-surface",
      )}
      data-testid={testid}
      role="radio"
      aria-checked={active}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={cn(
            "h-7 w-7 rounded-[8px] grid place-items-center",
            active ? "bg-blue text-white" : "bg-bg-panel text-ink-soft",
          )}
        >
          {icon}
        </span>
        <div className="text-[14px] font-semibold">{title}</div>
      </div>
      <div className="text-[12px] text-muted">{desc}</div>
      {disabled && disabledHint && (
        <div className="text-[11px] text-warn mt-2">{disabledHint}</div>
      )}
    </button>
  );
}

function SchemaFieldInput({
  field,
  value,
  onChange,
}: {
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `field-${field.name}`;
  const testid = `listing-field-${field.name}`;

  switch (field.type as FieldType) {
    case "SHORT_TEXT":
      return (
        <div>
          <Label htmlFor={id} required={field.required}>{field.label}</Label>
          <Input
            id={id}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            data-testid={testid}
          />
          {field.helpText && <Help>{field.helpText}</Help>}
        </div>
      );
    case "LONG_TEXT":
      return (
        <div>
          <Label htmlFor={id} required={field.required}>{field.label}</Label>
          <Textarea
            id={id}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            data-testid={testid}
          />
          {field.helpText && <Help>{field.helpText}</Help>}
        </div>
      );
    case "NUMBER":
      return (
        <div>
          <Label htmlFor={id} required={field.required}>{field.label}</Label>
          <Input
            id={id}
            type="number"
            value={(value as string | number | undefined) ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            data-testid={testid}
            className="tabular-nums"
          />
          {field.helpText && <Help>{field.helpText}</Help>}
        </div>
      );
    case "CURRENCY":
      return (
        <div>
          <Label htmlFor={id} required={field.required}>{field.label}</Label>
          <div className="relative max-w-[220px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
            <Input
              id={id}
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={(value as string | number | undefined) ?? ""}
              onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
              className="pl-7 tabular-nums"
              data-testid={testid}
            />
          </div>
          {field.helpText && <Help>{field.helpText}</Help>}
        </div>
      );
    case "DATE":
      return (
        <div>
          <Label htmlFor={id} required={field.required}>{field.label}</Label>
          <Input
            id={id}
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="max-w-[220px]"
            data-testid={testid}
          />
          {field.helpText && <Help>{field.helpText}</Help>}
        </div>
      );
    case "SELECT":
      return (
        <div>
          <Label htmlFor={id} required={field.required}>{field.label}</Label>
          <div className="max-w-[320px]">
            <Select value={(value as string) ?? ""} onValueChange={onChange}>
              <SelectTrigger data-testid={testid}>
                <SelectValue placeholder={i18n.t('...new.newListingForm.choosePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {field.helpText && <Help>{field.helpText}</Help>}
        </div>
      );
    case "MULTI_SELECT": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div>
          <Label required={field.required}>{field.label}</Label>
          <div className="flex flex-wrap gap-2" data-testid={testid}>
            {(field.options ?? []).map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() =>
                    onChange(
                      active ? selected.filter((s) => s !== opt) : [...selected, opt],
                    )
                  }
                  className={cn(
                    "px-3 h-8 rounded-full text-[12px] font-medium transition-colors",
                    active
                      ? "bg-ink text-white"
                      : "bg-surface border border-line text-ink-soft hover:bg-hover",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {field.helpText && <Help>{field.helpText}</Help>}
        </div>
      );
    }
    default:
      return null;
  }
}
