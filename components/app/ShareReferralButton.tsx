"use client";

import * as React from "react";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";

// SHK-043: lets members of a referral-entry marketplace copy a shareable
// invite link to the public marketplace page. Tags it with their user id
// as ?ref=<id> so the join flow can credit the referrer downstream.
export function ShareReferralButton({
  slug,
  referrerId,
  className,
}: {
  slug: string;
  referrerId: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://shouks.com";
    const link = `${origin}/m/${slug}?ref=${encodeURIComponent(referrerId)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — copy manually: " + link);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={className}
      aria-label="Copy invite link"
      data-testid="share-referral"
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? "Copied" : "Invite a friend"}
    </button>
  );
}
