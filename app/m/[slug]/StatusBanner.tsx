import Link from "next/link";
import { CheckCircle2, Clock3, XCircle, MessageSquareMore } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props = {
  slug: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
  reviewerNote?: string | null;
  rejectionReason?: string | null;
};

export function StatusBanner({ slug, status, reviewerNote, rejectionReason }: Props) {
  if (status === "PENDING") {
    return (
      <section
        className="rounded-[14px] border border-line bg-surface shadow-sm overflow-hidden"
        data-testid="status-banner-pending"
      >
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-warn-soft animate-ping" aria-hidden />
            <span className="relative grid place-items-center h-14 w-14 rounded-full bg-warn-soft text-warn">
              <Clock3 size={24} />
            </span>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-[22px] tracking-[-0.02em]">
              Your application is{" "}
              <em className="serif italic text-blue-ink">in review</em>.
            </h2>
            <p className="text-[14px] text-ink-soft max-w-[360px] mx-auto">
              We'll let you know shortly. Typical review takes ~48 hours.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (status === "APPROVED") {
    return (
      <section
        className="rounded-[14px] border border-success/30 bg-success-soft/40 shadow-sm overflow-hidden"
        data-testid="status-banner-approved"
      >
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <span className="grid place-items-center h-14 w-14 rounded-full bg-success-soft text-success">
            <CheckCircle2 size={26} />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-[22px] tracking-[-0.02em]">
              Welcome in —{" "}
              <em className="serif italic text-success">ready to browse?</em>
            </h2>
            <p className="text-[14px] text-ink-soft max-w-[360px] mx-auto">
              You're officially a member. The feed is warm and waiting.
            </p>
          </div>
          <Link href={`/m/${slug}/feed`} className="mt-1">
            <Button size="lg">Go to feed</Button>
          </Link>
        </div>
      </section>
    );
  }

  if (status === "REJECTED") {
    return (
      <section
        className="rounded-[14px] border border-line bg-surface shadow-sm overflow-hidden"
        data-testid="status-banner-rejected"
      >
        <div className="p-6 space-y-4">
          <div className="flex flex-col items-center text-center gap-3">
            <span className="grid place-items-center h-14 w-14 rounded-full bg-danger-soft text-danger">
              <XCircle size={24} />
            </span>
            <div className="space-y-1">
              <h2 className="text-[20px] tracking-[-0.02em]">
                Not a fit{" "}
                <em className="serif italic text-ink-soft">right now</em>.
              </h2>
              <p className="text-[13px] text-muted">
                The owners reviewed your application and decided not to proceed.
              </p>
            </div>
          </div>
          {(rejectionReason || reviewerNote) && (
            <div className="rounded-[10px] border border-line-soft bg-bg-soft p-4 space-y-2">
              {rejectionReason && (
                <div>
                  <div className="text-[11px] mono uppercase tracking-[0.14em] text-muted mb-1">
                    Reason
                  </div>
                  <p className="text-[13px] text-ink">{rejectionReason}</p>
                </div>
              )}
              {reviewerNote && (
                <div>
                  <div className="text-[11px] mono uppercase tracking-[0.14em] text-muted mb-1">
                    From the reviewer
                  </div>
                  <p className="text-[13px] text-ink whitespace-pre-line">
                    {reviewerNote}
                  </p>
                </div>
              )}
            </div>
          )}
          <p className="text-[12px] text-muted text-center">
            You can reapply in 30 days. Your Shouks account remains active.
          </p>
        </div>
      </section>
    );
  }

  // NEEDS_INFO
  return (
    <section
      className="rounded-[14px] border border-blue/30 bg-blue-softer shadow-sm overflow-hidden"
      data-testid="status-banner-needs-info"
    >
      <div className="p-6 space-y-4">
        <div className="flex flex-col items-center text-center gap-3">
          <span className="grid place-items-center h-14 w-14 rounded-full bg-blue-soft text-blue-ink">
            <MessageSquareMore size={24} />
          </span>
          <div className="space-y-1">
            <h2 className="text-[20px] tracking-[-0.02em]">
              Your reviewer asked for a{" "}
              <em className="serif italic text-blue-ink">follow-up</em>.
            </h2>
            <p className="text-[13px] text-muted">
              Your application is on hold — answer below to keep it moving.
            </p>
          </div>
        </div>
        {reviewerNote && (
          <div className="rounded-[10px] border border-line-soft bg-surface p-4">
            <div className="text-[11px] mono uppercase tracking-[0.14em] text-muted mb-1">
              From the reviewer
            </div>
            <p className="text-[13px] text-ink whitespace-pre-line">
              {reviewerNote}
            </p>
          </div>
        )}
        <div className="flex justify-center">
          <Link href={`/apply/${slug}`}>
            <Button>Re-submit application</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
