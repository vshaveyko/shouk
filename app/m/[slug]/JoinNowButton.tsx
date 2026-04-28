"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function JoinNowButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [joining, setJoining] = React.useState(false);

  async function join() {
    setJoining(true);
    try {
      const res = await fetch(`/api/marketplaces/${slug}/join`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't join. Try again.");
        return;
      }
      toast.success("You joined! Taking you to the feed…");
      router.push(`/m/${slug}/feed`);
      router.refresh();
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <Button size="lg" className="w-full" onClick={join} disabled={joining} data-testid="join-now-btn">
      {joining ? "Joining…" : <>Join now <ArrowRight size={16} /></>}
    </Button>
  );
}
