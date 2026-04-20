"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info, Lock, AlertTriangle } from "lucide-react";
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

type Initial = {
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  coverImageUrl: string | null;
  primaryColor: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "SCHEDULED_DELETION";
};

export function IdentityForm({ slug, initial }: { slug: string; initial: Initial }) {
  const router = useRouter();
  const [tagline, setTagline] = React.useState(initial.tagline ?? "");
  const [description, setDescription] = React.useState(initial.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = React.useState(initial.coverImageUrl ?? "");
  const [primaryColor, setPrimaryColor] = React.useState(initial.primaryColor ?? "#4DB7E8");
  const [saving, setSaving] = React.useState(false);
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
                <span className="truncate">shouks.co/m/{initial.slug}</span>
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
            <Label htmlFor="identity-cover">Cover image URL</Label>
            <Input
              id="identity-cover"
              data-testid="identity-cover"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://…"
              type="url"
            />
            <Help>Paste a public URL. Shown as the banner on your landing page.</Help>
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
