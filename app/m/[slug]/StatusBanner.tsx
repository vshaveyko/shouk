import Link from "next/link";
import { CheckCircle2, Clock3, XCircle, MessageSquareMore } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { i18n } from '@shipeasy/sdk/client'

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
              {i18n.t('...[slug].statusBanner.yourApplicationIs')}{" "}
              <em className="serif italic text-blue-ink">{i18n.t('...[slug].statusBanner.pendingReview')}</em>.
            </h2>
            <p className="text-[14px] text-ink-soft max-w-[360px] mx-auto">
              {i18n.t('...[slug].statusBanner.typicalReviewTakes48Hours')}
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
              {i18n.t('...[slug].statusBanner.welcomeIn')}{" "}
              <em className="serif italic text-success">{i18n.t('...[slug].statusBanner.readyToBrowse')}</em>
            </h2>
            <p className="text-[14px] text-ink-soft max-w-[360px] mx-auto">
              {i18n.t('...[slug].statusBanner.youreOfficiallyAMemberThe')}
            </p>
          </div>
          <Link href={`/m/${slug}/feed`} className="mt-1">
            <Button size="lg">{i18n.t('common.goToFeed')}</Button>
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
                {i18n.t('...[slug].statusBanner.notAFit')}{" "}
                <em className="serif italic text-ink-soft">{i18n.t('...[slug].statusBanner.rightNow')}</em>.
              </h2>
              <p className="text-[13px] text-muted">
                {i18n.t('...[slug].statusBanner.theOwnersReviewedYourApplication')}
              </p>
            </div>
          </div>
          {(rejectionReason || reviewerNote) && (
            <div className="rounded-[10px] border border-line-soft bg-bg-soft p-4 space-y-2">
              {rejectionReason && (
                <div>
                  <div className="text-[11px] mono uppercase tracking-[0.14em] text-muted mb-1">
                    {i18n.t('common.reason')}
                  </div>
                  <p className="text-[13px] text-ink">{rejectionReason}</p>
                </div>
              )}
              {reviewerNote && (
                <div>
                  <div className="text-[11px] mono uppercase tracking-[0.14em] text-muted mb-1">
                    {i18n.t('...[slug].statusBanner.fromTheReviewer')}
                  </div>
                  <p className="text-[13px] text-ink whitespace-pre-line">
                    {reviewerNote}
                  </p>
                </div>
              )}
            </div>
          )}
          <p className="text-[12px] text-muted text-center">
            {i18n.t('...[slug].statusBanner.youCanReapplyIn30')}
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
              {i18n.t('...[slug].statusBanner.yourReviewerAskedForA')}{" "}
              <em className="serif italic text-blue-ink">{i18n.t('...[slug].statusBanner.followUp')}</em>.
            </h2>
            <p className="text-[13px] text-muted">
              {i18n.t('...[slug].statusBanner.yourApplicationIsOnHold')}
            </p>
          </div>
        </div>
        {reviewerNote && (
          <div className="rounded-[10px] border border-line-soft bg-surface p-4">
            <div className="text-[11px] mono uppercase tracking-[0.14em] text-muted mb-1">
              {i18n.t('...[slug].statusBanner.fromTheReviewer')}
            </div>
            <p className="text-[13px] text-ink whitespace-pre-line">
              {reviewerNote}
            </p>
          </div>
        )}
        <div className="flex justify-center">
          <Link href={`/apply/${slug}`}>
            <Button>{i18n.t('...[slug].statusBanner.resubmitApplication')}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
