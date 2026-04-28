"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Help } from "@/components/ui/Input";
import { formatCents } from "@/lib/utils";

type EditListingFormProps = {
  listing: {
    id: string;
    title: string;
    description: string | null;
    priceCents: number | null;
    currency: string;
    images: string[];
    type: string;
    marketplaceSlug: string;
    schemaValues: Record<string, unknown>;
  };
};

export function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(listing.title);
  const [description, setDescription] = React.useState(listing.description ?? "");
  const [priceDollars, setPriceDollars] = React.useState(
    listing.priceCents != null ? (listing.priceCents / 100).toFixed(2) : "",
  );
  const [imageUrls, setImageUrls] = React.useState<string[]>(
    listing.images.length > 0 ? listing.images : [""],
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const isFixed = listing.type === "FIXED";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("Title is required."); return; }
    if (isFixed) {
      const price = parseFloat(priceDollars);
      if (!isFinite(price) || price < 0) { setError("Enter a valid price."); return; }
    }
    setSaving(true);
    try {
      const images = imageUrls.map((u) => u.trim()).filter(Boolean);
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        images,
        schemaValues: { ...listing.schemaValues, title: title.trim() },
      };
      if (isFixed) {
        const price = parseFloat(priceDollars);
        body.priceCents = Math.round(price * 100);
        (body.schemaValues as Record<string, unknown>).price = Math.round(price * 100);
      }
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Couldn't save."); return; }
      toast.success("Listing updated.");
      router.push(`/l/${listing.id}`);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentType: file.type, size: file.size }),
          });
          const { error, uploadUrl, publicUrl } = await res.json();
          if (error) throw new Error(error);
          await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
          return publicUrl as string;
        }),
      );
      setImageUrls((prev) => {
        const filtered = prev.filter(Boolean);
        return [...filtered, ...uploaded].slice(0, 8);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6 max-w-[640px] mx-auto px-4 py-8">
      <div>
        <Link
          href={`/l/${listing.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink mb-4"
        >
          <ArrowLeft size={14} /> Back to listing
        </Link>
        <h1 className="text-[26px] font-semibold tracking-[-0.01em]">Edit listing</h1>
      </div>

      {error && (
        <div className="rounded-[10px] bg-danger-soft border border-danger/20 px-4 py-3 text-[13.5px] text-danger">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          data-testid="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />
      </div>

      {isFixed && (
        <div>
          <Label htmlFor="edit-price">Price (USD)</Label>
          <Input
            id="edit-price"
            data-testid="edit-price"
            type="number"
            min="0"
            step="0.01"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
          />
        </div>
      )}

      <div>
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          data-testid="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={5000}
        />
      </div>

      <div>
        <Label>Photos</Label>
        <div className="space-y-2">
          {imageUrls.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={url}
                onChange={(e) => {
                  const next = [...imageUrls];
                  next[i] = e.target.value;
                  setImageUrls(next);
                }}
                placeholder="Image URL"
                data-testid={`edit-image-${i}`}
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="h-[38px] w-[38px] grid place-items-center rounded-[10px] border border-line text-ink-soft hover:text-danger shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-[9px] border border-line bg-surface text-[13px] cursor-pointer hover:bg-hover">
            <Upload size={14} />
            {uploading ? "Uploading…" : "Upload photos"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              data-testid="edit-upload"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
          {imageUrls.length < 8 && (
            <button
              type="button"
              onClick={() => setImageUrls((prev) => [...prev, ""])}
              className="text-[13px] text-blue-ink hover:underline"
            >
              + Add URL
            </button>
          )}
        </div>
        <Help>Up to 8 images.</Help>
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={saving} data-testid="edit-save">
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Link href={`/l/${listing.id}`}>
          <Button type="button" variant="secondary">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}
