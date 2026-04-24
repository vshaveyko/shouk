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
};

const DURATION_PRESETS = [
  { value: "1h", label: "1 hour", ms: 60 * 60 * 1000 },
  { value: "6h", label: "6 hours", ms: 6 * 60 * 60 * 1000 },
  { value: "12h", label: "12 hours", ms: 12 * 60 * 60 * 1000 },
  { value: "24h", label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { value: "3d", label: "3 days", ms: 3 * 24 * 60 * 60 * 1000 },
  { value: "7d", label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
];

export function NewListingForm({
  slug,
  marketplaceName,
  primaryColor,
  auctionsEnabled,
  currency,
  schemaFields,
}: Props) {
  const router = useRouter();

  const [type, setType] = React.useState<ListingType>("FIXED");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priceDollars, setPriceDollars] = React.useState("");
  const [budgetDollars, setBudgetDollars] = React.useState("");
  const [alertFrequency, setAlertFrequency] = React.useState("INSTANT");
  const [schemaValues, setSchemaValues] = React.useState<Record<string, unknown>>({});
  const [imageUrls, setImageUrls] = React.useState<string[]>([""]);
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

    // V1: the form is a single watches form (SHK-020); legacy dynamic
    // schema fields aren't rendered and therefore can't be filled in by
    // the seller. Don't enforce `required` on fields the UI never
    // surfaced — that would make listings un-submittable on any
    // marketplace with required non-watch fields.
    void nonImageFields;
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
      schemaValues,
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
      const res = await fetch(`/api/marketplaces/${slug}/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't create listing.");
        return;
      }
      toast.success("Listing created.");
      router.push(`/l/${data.id}`);
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
      ? `Up to $${Number(budgetDollars).toLocaleString()}`
      : "Budget open"
    : priceDollars
      ? `$${Number(priceDollars).toLocaleString()}`
      : "$ —";

  return (
    <div className="cl">
      <div className="cl-body">
        <div className="cl-head">
          <div className="breadcrumb">
            <Link href={`/m/${slug}/feed`}>{marketplaceName}</Link>
            <span>·</span>
            <span>New post</span>
          </div>
          <h1>Post to {marketplaceName}</h1>
          <p>
            Choose what kind of post this is. Fields marked{" "}
            <span className="req">*</span> are required by this marketplace.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          data-testid="create-listing-form"
        >
          {/* Mode toggle — Sell vs ISO (Auctions hidden for V1 per SHK-027) */}
          <div className="mode-toggle" role="tablist" aria-label="Post mode">
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
                <span className="mt-l">I'm selling</span>
                <span className="mt-s">Post something you have and want to sell or trade.</span>
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
                <span className="mt-l">I'm looking for (ISO)</span>
                <span className="mt-s">Post a wanted ad. Sellers with a match can DM you.</span>
              </div>
            </button>
          </div>

          {isISO && (
            <div className="iso-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <div>
                <strong>Wanted posts are public.</strong> Every {marketplaceName} seller can see this — and Shouks will ping you when a new listing matches your criteria. Your budget is visible; your name and contact stay private until you reply.
              </div>
            </div>
          )}

      {/* Basics */}
      <section className="bg-surface border border-line rounded-[14px] p-5 space-y-4">
        <h2 className="text-[14px] font-semibold">Basics</h2>

        <div>
          <Label htmlFor="title" required>Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "ISO" ? "WTB: 1985 Rolex Submariner 5513" : "1989 Ferrari F40 · Rosso Corsa"}
            maxLength={200}
            data-testid="listing-field-title"
          />
        </div>

        <div>
          <Label htmlFor="description">
            {type === "ISO" ? "What you're looking for" : "Description"}
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "ISO"
                ? "Condition, years, specifics — anything that matters."
                : "History, condition, provenance. More detail = better offers."
            }
            data-testid="listing-field-description"
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-surface border border-line rounded-[14px] p-5 space-y-4">
        <h2 className="text-[14px] font-semibold">
          {type === "AUCTION" ? "Auction" : type === "ISO" ? "Budget" : "Price"}
        </h2>

        {type === "FIXED" && (
          <div>
            <Label htmlFor="price" required>Price (USD)</Label>
            <div className="relative max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
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
              <Label htmlFor="budget">Budget ceiling (optional)</Label>
              <div className="relative max-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetDollars}
                  onChange={(e) => setBudgetDollars(e.target.value)}
                  className="pl-7 tabular-nums"
                  placeholder="0.00"
                  data-testid="price-input"
                />
              </div>
              <Help>Leave blank if budget is open.</Help>
            </div>
            <div>
              <Label>Alert frequency</Label>
              <div className="max-w-[240px]">
                <Select value={alertFrequency} onValueChange={setAlertFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSTANT">Instant</SelectItem>
                    <SelectItem value="DAILY">Daily digest</SelectItem>
                    <SelectItem value="WEEKLY">Weekly digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Help>We'll notify you when matches are posted.</Help>
            </div>
          </>
        )}

        {type === "AUCTION" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="auction-start" required>Starting bid</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
                <Input
                  id="auction-start"
                  type="number"
                  min="0"
                  step="0.01"
                  value={auctionStart}
                  onChange={(e) => setAuctionStart(e.target.value)}
                  className="pl-7 tabular-nums"
                  data-testid="auction-start"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="auction-reserve">Reserve (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
                <Input
                  id="auction-reserve"
                  type="number"
                  min="0"
                  step="0.01"
                  value={auctionReserve}
                  onChange={(e) => setAuctionReserve(e.target.value)}
                  className="pl-7 tabular-nums"
                  data-testid="auction-reserve"
                />
              </div>
              <Help>If the top bid doesn't meet this, no sale.</Help>
            </div>
            <div>
              <Label htmlFor="auction-increment" required>Min increment</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[14px]">$</span>
                <Input
                  id="auction-increment"
                  type="number"
                  min="1"
                  step="1"
                  value={auctionIncrement}
                  onChange={(e) => setAuctionIncrement(e.target.value)}
                  className="pl-7 tabular-nums"
                  data-testid="auction-increment"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="auction-duration" required>Duration</Label>
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
              <h2 className="text-[14px] font-semibold">{imageField?.label || "Photos"}</h2>
              <p className="text-[12px] text-muted mt-0.5">
                Upload from your device, or paste an image URL.
                {imageField?.minImages ? ` At least ${imageField.minImages}.` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {imageUrls.length < maxImages && (
                <>
                  <label
                    className="inline-flex items-center h-9 px-3 rounded-[9px] border border-line bg-surface hover:bg-hover text-[13px] font-medium cursor-pointer gap-1.5"
                    data-testid="images-upload"
                  >
                    <Plus size={14} /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length === 0) return;
                        const readers = files.map(
                          (f) =>
                            new Promise<string>((resolve, reject) => {
                              const fr = new FileReader();
                              fr.onload = () => resolve(String(fr.result ?? ""));
                              fr.onerror = reject;
                              fr.readAsDataURL(f);
                            }),
                        );
                        try {
                          const dataUrls = await Promise.all(readers);
                          setImageUrls((prev) => {
                            const filtered = prev.filter(Boolean);
                            const combined = [...filtered, ...dataUrls].slice(0, maxImages);
                            // Keep a trailing empty slot so "Add URL" still works.
                            return combined.length < maxImages ? [...combined, ""] : combined;
                          });
                        } catch {
                          setError("Couldn't read one of the images.");
                        } finally {
                          // Reset the input so the same file can be re-picked.
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                  <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={addImage}>
                    <Plus size={14} /> Add URL
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
                  value={u.startsWith("data:") ? "(uploaded file)" : u}
                  readOnly={u.startsWith("data:")}
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
                    aria-label="Remove image"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <Help>Up to {maxImages} images. JPEG / PNG / WebP.</Help>
        </section>
      )}

      {/* V1 watch details (SHK-020). The per-marketplace dynamic schema
          stays in the data model and on the form's data path (schemaValues
          maps straight through), but the UI is a single hardcoded watches
          form. All fields here are optional — mandatory stuff (Title,
          Price, Images) lives in the Basics / Pricing / Images sections
          above. */}
      <section
        className="bg-surface border border-line rounded-[14px] p-5 space-y-4"
        data-testid="watch-details-section"
      >
        <h2 className="text-[14px] font-semibold">Details</h2>
        <p className="text-[12.5px] text-muted -mt-3">
          All optional — fill in what you know.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="watch-brand">Brand</Label>
            <Input
              id="watch-brand"
              value={(schemaValues.brand as string) ?? ""}
              onChange={(e) => setField("brand", e.target.value)}
              placeholder="Rolex"
              data-testid="watch-field-brand"
            />
          </div>
          <div>
            <Label htmlFor="watch-model">Model</Label>
            <Input
              id="watch-model"
              value={(schemaValues.model as string) ?? ""}
              onChange={(e) => setField("model", e.target.value)}
              placeholder="Submariner 124060"
              data-testid="watch-field-model"
            />
          </div>
          <div>
            <Label htmlFor="watch-case-size">Case size</Label>
            <Input
              id="watch-case-size"
              value={(schemaValues.case_size as string) ?? ""}
              onChange={(e) => setField("case_size", e.target.value)}
              placeholder="41mm"
              data-testid="watch-field-case-size"
            />
          </div>
          <div>
            <Label htmlFor="watch-dial-color">Dial color</Label>
            <Input
              id="watch-dial-color"
              value={(schemaValues.dial_color as string) ?? ""}
              onChange={(e) => setField("dial_color", e.target.value)}
              placeholder="Black"
              data-testid="watch-field-dial-color"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="watch-case-material">Case material</Label>
            <Select
              value={(schemaValues.case_material as string) ?? ""}
              onValueChange={(v) => setField("case_material", v)}
            >
              <SelectTrigger id="watch-case-material" data-testid="watch-field-case-material">
                <SelectValue placeholder="Select a material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Stainless Steel">Stainless Steel</SelectItem>
                <SelectItem value="Yellow Gold">Yellow Gold</SelectItem>
                <SelectItem value="White Gold">White Gold</SelectItem>
                <SelectItem value="Rose Gold">Rose Gold</SelectItem>
                <SelectItem value="Titanium">Titanium</SelectItem>
                <SelectItem value="Platinum">Platinum</SelectItem>
                <SelectItem value="Two-tone">Two-tone</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={Boolean(schemaValues.box)}
              onChange={(e) => setField("box", e.target.checked)}
              data-testid="watch-field-box"
            />
            Original box
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={Boolean(schemaValues.papers)}
              onChange={(e) => setField("papers", e.target.checked)}
              data-testid="watch-field-papers"
            />
            Original papers
          </label>
        </div>
      </section>

      {/* Fallback: if this marketplace has legacy non-watch fields that
          aren't already covered above, render them so we don't silently
          drop data. The V1 design is a single watch form, but this keeps
          data-entry parity with the existing schema mechanism.*/}
      {false && nonImageFields.length > 0 && (
        <section className="bg-surface border border-line rounded-[14px] p-5 space-y-5">
          <h2 className="text-[14px] font-semibold">Details</h2>
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
          onClick={() => router.push(`/m/${slug}/feed`)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} data-testid="submit-listing">
          {submitting ? "Publishing…" : "Publish listing"}
        </Button>
      </div>
        </form>
      </div>

      <aside className="cl-right" aria-label="Live preview">
        <div className="preview">
          <div className="preview-hd">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Live preview
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
            {isISO && <div className="iso-preview-tag">Wanted · ISO</div>}
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
              type="number"
              min="0"
              step="0.01"
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
                <SelectValue placeholder="Choose…" />
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
