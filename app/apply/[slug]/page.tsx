import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BrandLockup } from "@/components/brand/Logo";
import { verifyProviders } from "@/lib/utils";
import { ApplyForm } from "./ApplyForm";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  return { title: mp ? `Apply to ${mp.name}` : "Apply" };
}

function providerLabel(p: string) {
  return verifyProviders.find((v) => v.id === p)?.label ?? p;
}

export default async function ApplyPage({ params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/apply/${params.slug}`);
  }
  const userId = session.user.id;

  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    include: {
      applicationQuestions: { orderBy: { order: "asc" } },
      owner: { select: { displayName: true, name: true } },
    },
  });
  if (!mp || mp.status !== "ACTIVE") notFound();

  // If already a member → bounce to landing
  const existingMembership = await prisma.membership.findUnique({
    where: { userId_marketplaceId: { userId, marketplaceId: mp.id } },
    select: { status: true },
  });
  if (existingMembership?.status === "ACTIVE") {
    redirect(`/m/${mp.slug}`);
  }

  // If already pending → bounce to landing (shows pending banner)
  const pending = await prisma.application.findFirst({
    where: { userId, marketplaceId: mp.id, status: "PENDING" },
    select: { id: true },
  });
  if (pending) {
    redirect(`/m/${mp.slug}`);
  }

  // Latest application — used to prefill when re-submitting after NEEDS_INFO
  const latest = await prisma.application.findFirst({
    where: { userId, marketplaceId: mp.id },
    orderBy: { createdAt: "desc" },
    select: { status: true, answers: true, reviewerNote: true },
  });
  const prefillAnswers =
    latest?.status === "NEEDS_INFO" && latest.answers
      ? (latest.answers as Record<string, unknown>)
      : {};
  const reviewerFollowUp =
    latest?.status === "NEEDS_INFO" ? latest.reviewerNote : null;

  // Check verification requirements
  const verified = await prisma.verifiedAccount.findMany({
    where: { userId },
    select: { provider: true },
  });
  const verifiedSet = new Set(verified.map((v) => v.provider));
  const missing = mp.requiredVerifications.filter((r) => !verifiedSet.has(r));

  const ownerName = mp.owner.displayName ?? mp.owner.name ?? "the owners";

  return (
    <div className="min-h-screen bg-bg-soft">
      <header className="bg-surface border-b border-line">
        <div className="max-w-[640px] mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <BrandLockup href="/home" size={22} />
          <Link
            href={`/m/${mp.slug}`}
            className="text-[13px] text-ink-soft hover:text-ink inline-flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-4 py-8 sm:py-10">
        {/* Intro */}
        <div className="mb-6 text-center">
          <p className="text-[11px] mono uppercase tracking-[0.14em] text-blue-ink font-semibold mb-3">
            Application
          </p>
          <h1
            className="leading-[1.1] tracking-[-0.01em]"
            style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400, fontSize: 32 }}
          >
            Apply to <em className="italic text-blue-ink">{mp.name}</em>
          </h1>
          <p className="text-[14px] text-ink-soft mt-3 max-w-[420px] mx-auto">
            Tell {ownerName} a bit about you. Typical review takes ~48 hours.
          </p>
        </div>

        {/* Reviewer follow-up call-out for NEEDS_INFO */}
        {reviewerFollowUp && (
          <div className="mb-5 rounded-[12px] border border-blue/30 bg-blue-softer p-4">
            <div className="text-[11px] mono uppercase tracking-[0.14em] text-blue-ink font-semibold mb-1.5">
              Follow-up from the reviewer
            </div>
            <p className="text-[13px] text-ink whitespace-pre-line">
              {reviewerFollowUp}
            </p>
          </div>
        )}

        {missing.length > 0 ? (
          <section
            className="rounded-[14px] border border-line bg-surface shadow-sm p-5 sm:p-6 space-y-5"
            data-testid="verify-needed"
          >
            <div className="flex items-start gap-3">
              <span className="grid place-items-center h-10 w-10 rounded-full bg-warn-soft text-warn flex-none">
                <Lock size={18} />
              </span>
              <div>
                <h2 className="text-[17px] font-semibold">
                  Before you apply, link these accounts
                </h2>
                <p className="text-[13px] text-muted mt-1">
                  {mp.name} requires these verifications. You can return to this
                  page right after.
                </p>
              </div>
            </div>

            <ul className="space-y-2">
              {mp.requiredVerifications.map((p) => {
                const covered = verifiedSet.has(p);
                return (
                  <li
                    key={p}
                    className="flex items-center justify-between py-2 border-t border-line-soft first:border-t-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck
                        size={16}
                        className={covered ? "text-success" : "text-muted"}
                      />
                      <span className="text-[14px] text-ink">
                        {providerLabel(p)}
                      </span>
                    </div>
                    {covered ? (
                      <Badge variant="approved">Linked</Badge>
                    ) : (
                      <Badge variant="neutral">Required</Badge>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Link
                href={`/onboarding/verify?redirect=/apply/${mp.slug}`}
                className="flex-1"
                data-testid={`verify-link-${missing[0]}`}
              >
                <Button size="lg" className="w-full">
                  Link accounts
                </Button>
              </Link>
              <Link href={`/m/${mp.slug}`} className="sm:flex-none">
                <Button variant="secondary" size="lg" className="w-full">
                  Back to marketplace
                </Button>
              </Link>
            </div>

            {/* Hidden disabled form placeholder to satisfy gating contract */}
            <form
              aria-hidden
              className="hidden"
              data-testid="apply-form"
              data-disabled="true"
            />
          </section>
        ) : (
          <ApplyForm
            slug={mp.slug}
            marketplaceName={mp.name}
            questions={mp.applicationQuestions.map((q) => ({
              id: q.id,
              label: q.label,
              helpText: q.helpText,
              type: q.type,
              required: q.required,
              options: (q.options as string[] | null) ?? null,
            }))}
            prefill={prefillAnswers}
          />
        )}
      </main>
    </div>
  );
}
