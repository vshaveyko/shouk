"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Help } from "@/components/ui/Input";

export function ProfileForm({
  initialDisplayName,
  initialBio,
}: {
  initialDisplayName: string;
  initialBio: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [displayName, setDisplayName] = React.useState(initialDisplayName);
  const [bio, setBio] = React.useState(initialBio);
  const [savedDisplayName, setSavedDisplayName] = React.useState(initialDisplayName);
  const [savedBio, setSavedBio] = React.useState(initialBio);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function cancel() {
    setDisplayName(savedDisplayName);
    setBio(savedBio);
    setEditing(false);
    setError(null);
  }

  async function save() {
    if (!displayName.trim()) {
      setError("Display name can't be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't save changes.");
        return;
      }
      setSavedDisplayName(data.displayName ?? displayName.trim());
      setSavedBio(data.bio ?? "");
      toast.success("Profile updated.");
      setEditing(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-surface border border-line rounded-[14px] p-6" data-testid="profile-bio-card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[16px] font-semibold">About you</h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-[13px] text-blue-ink hover:underline"
            data-testid="edit-bio"
          >
            <Pencil size={13} /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName" required>Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              data-testid="display-name-input"
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short line or two about what you collect, trade, or follow."
              maxLength={500}
              data-testid="bio-input"
            />
            <Help>{bio.length}/500 characters</Help>
          </div>
          {error && (
            <div className="rounded-[10px] border border-danger/30 bg-danger-soft p-2.5 text-[13px] text-danger">
              {error}
            </div>
          )}
          <div className="flex items-center gap-2 justify-end">
            <Button variant="secondary" onClick={cancel} className="gap-1.5" type="button">
              <X size={14} /> Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="gap-1.5" type="button" data-testid="save-bio">
              <Check size={14} /> {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <div className="text-[11px] mono uppercase tracking-[0.12em] text-muted mb-0.5">Display name</div>
            <div className="text-[15px] text-ink">{savedDisplayName || "—"}</div>
          </div>
          <div className="pt-1">
            <div className="text-[11px] mono uppercase tracking-[0.12em] text-muted mb-0.5">Bio</div>
            {savedBio ? (
              <p className="text-[14px] text-ink-soft leading-[1.6] whitespace-pre-line" data-testid="bio-display">
                {savedBio}
              </p>
            ) : (
              <p className="text-[14px] text-muted italic">No bio yet — add one so other members know what you're about.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
