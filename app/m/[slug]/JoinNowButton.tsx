"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { i18n } from '@shipeasy/sdk/client'

export function JoinNowButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [joining, setJoining] = React.useState(false);

  async function join() {
    setJoining(true);
    try {
      const res = await fetch(`/api/marketplaces/${slug}/join`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? i18n.t('...[slug].joinNowButton.couldntJoinTryAgain'));
        return;
      }
      toast.success(i18n.t('...[slug].joinNowButton.youJoinedTakingYouTo'));
      router.push(`/m/${slug}/feed`);
      router.refresh();
    } catch {
      toast.error(i18n.t('...[slug].joinNowButton.networkErrorTryAgain'));
    } finally {
      setJoining(false);
    }
  }

  return (
    <Button size="lg" className="w-full" onClick={join} disabled={joining} data-testid="join-now-btn">
      {joining ? i18n.t('...[slug].joinNowButton.joining') : <>{i18n.t('...[slug].joinNowButton.joinNow')} <ArrowRight size={16} /></>}
    </Button>
  );
}
