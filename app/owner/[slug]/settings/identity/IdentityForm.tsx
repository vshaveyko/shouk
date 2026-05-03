"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info, Lock, AlertTriangle, Upload, X } from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Label,
  Help,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui";

type EntryMethod = "APPLICATION" | "INVITE" | "REFERRAL" | "PUBLIC";

type Initial = {
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  coverImageUrl: string | null;
  primaryColor: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "SCHEDULED_DELETION";
  entryMethod: EntryMethod;
};

type Visibility = "PUBLIC" | "CLOSED" | "PRIVATE";

const VISIBILITY_OPTIONS: { id: Visibility; title: string; body: string; tag: string }[] = [
  {
    id: "PUBLIC",
    title: "Public",
    body: "Anyone can discover the marketplace and browse listings. Best for open communities and merchants who want organic traffic.",
    tag: "OPEN",
  },
  {
    id: "CLOSED",
    title: "Closed",
    body: 'Marketplace is listed publicly, but only members can browse listings. Non-members see a "Request to join" page. Best for most curated communities.',
    tag: "GATED",
  },
  {
    id: "PRIVATE",
    title: "Private",
    body: "Hidden from Explore and search. Only direct invite links lead to the marketplace. Best for small trusted groups and beta launches.",
    tag: "HIDDEN",
  },
];

const JOIN_OPTIONS: { id: "APPLICATION" | "REFERRAL"; title: string; body: string }[] = [
  {
    id: "APPLICATION",
    title: "Application",
    body: "Prospective members answer questions you define. You review and approve or reject each one.",
  },
  {
    id: "REFERRAL",
    title: "Referral",
    body: "Existing members vouch for newcomers. Optionally auto-approve referrals.",
  },
];

function visibilityFromEntry(em: EntryMethod): Visibility {
  if (em === "PUBLIC") return "PUBLIC";
  if (em === "INVITE") return "PRIVATE";
  return "CLOSED";
}

export function IdentityForm({ slug, initial }: { slug: string; initial: Initial }) {
  const router = useRouter();
  const [tagline, setTagline] = React.useState(initial.tagline ?? "");
  const [description, setDescription] = React.useState(initial.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = React.useState(initial.coverImageUrl ?? "");
  const [primaryColor, setPrimaryColor] = React.useState(initial.primaryColor ?? "#4DB7E8");
  const [entryMethod, setEntryMethod] = React.useState<EntryMethod>(initial.entryMethod);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const coverFileRef = React.useRef<HTMLInputElement>(null);

  async function uploadCover(file: File) {
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json?.error ?? "Upload failed."); return; }
      const { uploadUrl, publicUrl } = json as { uploadUrl: string; publicUrl: string };
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) { toast.error("Upload failed."); return; }
      setCoverImageUrl(publicUrl);
    } catch {
      toast.error("Network error during upload.");
    } finally {
      setUploading(false);
    }
  }
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);
  const [deactivating, setDeactivating] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (primaryColor && !/^#([0-9a-fA-F]{6})$/.test(primaryColor)) {
      toast.error("Primary color must be a 6-digit hex, e.g. #4DB7E8.");
      return;
    }
    if (description.length > 500) {
      toast.error("Description must be 500 characters or fewer.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/marketplaces/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: tagline.trim() || null,
          description: description.trim() || null,
          coverImageUrl: coverImageUrl.trim() || null,
          primaryColor: primaryColor || null,
          entryMethod,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? "Couldn't save changes.");
        return;
      }
      toast.success("Identity saved.");
      router.refresh();
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate() {
    setDeactivating(true);
    try {
      const res = await fetch(`/api/marketplaces/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INACTIVE" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? "Couldn't deactivate marketplace.");
        return;
      }
      toast.success("Marketplace deactivated.");
      setDeactivateOpen(false);
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <form onSubmit={save} data-testid="identity-form" className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>
            How members will recognize your marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="identity-name">Marketplace name</Label>
              <div
                className="flex items-center gap-2 h-[38px] px-3 rounded-[10px] border border-line bg-bg-panel text-[14px] text-ink-soft"
                title="Name is locked for an established marketplace. Contact support to change."
              >
                <Lock size={13} className="text-muted" />
                <span className="truncate">{initial.name}</span>
              </div>
              <Help>
                Locked after launch. Reach out to support if you need to rename.
              </Help>
            </div>
            <div>
              <Label htmlFor="identity-slug">URL slug</Label>
              <div
                className="flex items-center gap-2 h-[38px] px-3 rounded-[10px] border border-line bg-bg-panel text-[14px] text-ink-soft"
                title="Slug is locked — changing it would break existing links."
              >
                <Lock size={13} className="text-muted" />
                <span className="truncate">shouks.com/m/{initial.slug}</span>
              </div>
              <Help>Locked — changing it would break every existing link.</Help>
            </div>
          </div>

          <div>
            <Label htmlFor="identity-tagline">Tagline</Label>
            <Input
              id="identity-tagline"
              data-testid="identity-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A one-liner that captures the vibe."
              maxLength={140}
            />
            <Help>Up to 140 characters.</Help>
          </div>

          <div>
            <Label htmlFor="identity-description">Description</Label>
            <Textarea
              id="identity-description"
              data-testid="identity-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this community for?"
              maxLength={500}
              rows={4}
            />
            <Help>{description.length}/500 characters.</Help>
          </div>

          <div>
            <Label>Cover image</Label>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              data-testid="identity-cover-file"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadCover(f); }}
            />
            {coverImageUrl ? (
              <div className="relative rounded-[10px] overflow-hidden border border-line" style={{ height: 120 }}>
                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                  <button
                    type="button"
                    onClick={() => coverFileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-ink text-[12px] font-medium rounded-[7px]"
                  >
                    <Upload size={13} /> {uploading ? "Uploading…" : "Replace"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl("")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-danger text-[12px] font-medium rounded-[7px]"
                    aria-label="Remove cover image"
                  >
                    <X size={13} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                data-testid="identity-cover"
                onClick={() => coverFileRef.current?.click()}
                disabled={uploading}
                className="w-full h-[100px] rounded-[10px] border border-dashed border-line bg-bg-soft flex flex-col items-center justify-center gap-1.5 text-muted hover:border-ink-soft hover:text-ink transition"
              >
                <Upload size={18} />
                <span className="text-[12.5px] font-medium">{uploading ? "Uploading…" : "Upload cover image"}</span>
                <span className="text-[11px]">Shown as the banner on your landing page.</span>
              </button>
            )}
          </div>

          <div>
            <Label htmlFor="identity-color">Primary color</Label>
            <div className="flex items-center gap-2">
              <div
                className="h-[38px] w-[38px] rounded-[10px] border border-line shrink-0"
                style={{ backgroundColor: primaryColor }}
                aria-hidden
              />
              <Input
                id="identity-color"
                data-testid="identity-color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#4DB7E8"
                maxLength={7}
              />
              <input
                type="color"
                aria-label="Pick a color"
                data-testid="identity-color-picker"
                value={
                  /^#([0-9a-fA-F]{6})$/.test(primaryColor) ? primaryColor : "#4DB7E8"
                }
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-[38px] w-[38px] rounded-[10px] border border-line cursor-pointer bg-surface"
              />
            </div>
            <Help>6-digit hex. Used for accents on your marketplace pages.</Help>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            type="submit"
            variant="primary"
            data-testid="identity-save"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Control who can discover and join your marketplace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-muted mb-2">Visibility</div>
            <div className="space-y-2" role="radiogroup" aria-label="Visibility">
              {VISIBILITY_OPTIONS.map((opt) => {
                const selected = visibilityFromEntry(entryMethod) === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-testid={`identity-visibility-${opt.id.toLowerCase()}`}
                    onClick={() => {
                      if (opt.id === "PUBLIC") setEntryMethod("PUBLIC");
                      else if (opt.id === "PRIVATE") setEntryMethod("INVITE");
                      else {
                        const keep = entryMethod === "APPLICATION" || entryMethod === "REFERRAL";
                        setEntryMethod(keep ? entryMethod : "APPLICATION");
                      }
                    }}
                    className={`flex items-start gap-3 w-full text-left rounded-[10px] border p-4 transition ${
                      selected
                        ? "border-blue bg-blue-soft ring-[3px] ring-[var(--blue-softer)]"
                        : "border-line bg-surface hover:bg-hover"
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 ${selected ? "border-blue bg-blue" : "border-line"}`}
                      aria-hidden
                    >
                      {selected && <span className="block h-full w-full rounded-full bg-white scale-50" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[14px] font-semibold">{opt.title}</span>
                        <span className="text-[10.5px] font-semibold tracking-wide text-muted">{opt.tag}</span>
                      </div>
                      <p className="text-[12.5px] text-muted">{opt.body}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {visibilityFromEntry(entryMethod) === "CLOSED" && (
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wide text-muted mb-2">Ways to join</div>
              <div className="space-y-2" role="radiogroup" aria-label="Ways to join">
                {JOIN_OPTIONS.map((opt) => {
                  const selected = entryMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-testid={`identity-join-${opt.id.toLowerCase()}`}
                      onClick={() => setEntryMethod(opt.id)}
                      className={`flex items-start gap-3 w-full text-left rounded-[10px] border p-4 transition ${
                        selected
                          ? "border-blue bg-blue-soft ring-[3px] ring-[var(--blue-softer)]"
                          : "border-line bg-surface hover:bg-hover"
                      }`}
                    >
                      <span
                        className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 ${selected ? "border-blue bg-blue" : "border-line"}`}
                        aria-hidden
                      >
                        {selected && <span className="block h-full w-full rounded-full bg-white scale-50" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold mb-1">{opt.title}</div>
                        <p className="text-[12.5px] text-muted">{opt.body}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            type="submit"
            variant="primary"
            data-testid="identity-privacy-save"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-danger/20">
        <CardHeader>
          <CardTitle className="text-danger">Danger zone</CardTitle>
          <CardDescription>
            Deactivating hides your marketplace from members and visitors. You can
            reactivate later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line-soft bg-bg-panel px-4 py-3">
            <div className="flex items-start gap-2 min-w-0">
              <Info size={16} className="text-muted mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[14px] font-medium">
                  Status:{" "}
                  <span
                    className={
                      initial.status === "ACTIVE"
                        ? "text-success"
                        : "text-muted"
                    }
                  >
                    {initial.status}
                  </span>
                </div>
                <div className="text-[12.5px] text-muted">
                  Members lose access to listings until you reactivate.
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="danger"
              data-testid="identity-deactivate"
              onClick={() => setDeactivateOpen(true)}
              disabled={initial.status === "INACTIVE"}
            >
              Deactivate
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-danger-soft grid place-items-center shrink-0">
                <AlertTriangle size={18} className="text-danger" />
              </div>
              <div>
                <DialogTitle>Deactivate this marketplace?</DialogTitle>
                <DialogDescription>
                  Listings, applications, and member activity will pause until you
                  reactivate. No data is deleted.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <ul className="space-y-1.5 text-[13.5px] text-ink-soft list-disc pl-5">
              <li>Members cannot post or bid.</li>
              <li>New applications are blocked.</li>
              <li>The public page shows as unavailable.</li>
            </ul>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" data-testid="identity-deactivate-cancel">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="danger"
              data-testid="identity-deactivate-confirm"
              onClick={deactivate}
              disabled={deactivating}
            >
              {deactivating ? "Deactivating…" : "Yes, deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
