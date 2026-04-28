import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Check, ShieldCheck, Users, Package, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BrandLockup } from "@/components/brand/Logo";
import { verifyProviders } from "@/lib/utils";
import { StatusBanner } from "./StatusBanner";
import { JoinNowButton } from "./JoinNowButton";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    select: { name: true, tagline: true, description: true },
  });
  if (!mp) return { title: "Marketplace not found" };
  return {
    title: mp.name,
    description: mp.tagline ?? mp.description ?? undefined,
  };
}

function providerLabel(p: string) {
  return verifyProviders.find((v) => v.id === p)?.label ?? p;
}

export default async function MarketplaceLanding({ params }: { params: Params }) {
  const mp = await prisma.marketplace.findUnique({
    where: { slug: params.slug },
    include: {
      schemaFields: { orderBy: { order: "asc" } },
      applicationQuestions: { orderBy: { order: "asc" } },
      owner: {
        select: { id: true, name: true, displayName: true, image: true },
      },
      _count: { select: { memberships: true, listings: true } },
    },
  });

  if (!mp || mp.status !== "ACTIVE") notFound();

  const session = await auth();
  const userId = session?.user?.id;

  type LatestApp = {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
    reviewerNote: string | null;
    rejectionReason: string | null;
  };

  let verifiedAccounts: { provider: string }[] = [];
  let membership: { status: string; role: string } | null = null;
  let latestApplication: LatestApp | null = null;

  if (userId) {
    const [v, m, app] = await Promise.all([
      prisma.verifiedAccount.findMany({
        where: { userId },
        select: { provider: true },
      }),
      prisma.membership.findUnique({
        where: { userId_marketplaceId: { userId, marketplaceId: mp.id } },
        select: { status: true, role: true },
      }),
      prisma.application.findFirst({
        where: { userId, marketplaceId: mp.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          reviewerNote: true,
          rejectionReason: true,
        },
      }),
    ]);
    verifiedAccounts = v;
    membership = m;
    latestApplication = app as LatestApp | null;
  }

  const isActiveMember = membership?.status === "ACTIVE";
  if (isActiveMember) redirect(`/m/${mp.slug}/feed`);
  const verifiedSet = new Set(verifiedAccounts.map((v) => v.provider));
  const requirements = mp.requiredVerifications;
  const missingRequirements = requirements.filter((r) => !verifiedSet.has(r));

  const ownerName = mp.owner.displayName ?? mp.owner.name ?? "The owner";
  const headerGradient = mp.coverImageUrl
    ? undefined
    : `linear-gradient(135deg, ${mp.primaryColor ?? "oklch(0.66 0.16 230)"}, oklch(0.5 0.15 232))`;

  // Decide which primary CTA block to render
  let primaryBlock: React.ReactNode = null;

  if (!userId) {
    const callbackUrl = mp.entryMethod === "PUBLIC" ? `/m/${mp.slug}` : `/apply/${mp.slug}`;
    primaryBlock = (
      <div
        className="rounded-[14px] border border-line bg-surface shadow-sm p-5 space-y-3"
        data-testid="cta-unauthenticated"
      >
        <div>
          <h2 className="text-[17px] font-semibold">
            {mp.entryMethod === "PUBLIC" ? "Join" : "Apply to join"}
          </h2>
          <p className="text-[13px] text-muted mt-1">
            {mp.entryMethod === "PUBLIC"
              ? "Sign in to join instantly."
              : `Create your Shouks account and submit an application to ${mp.name}.`}
          </p>
        </div>
        <Link href={`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          <Button size="lg" className="w-full">
            {mp.entryMethod === "PUBLIC" ? "Sign in to join" : "Sign in to apply"}{" "}
            <ArrowRight size={16} />
          </Button>
        </Link>
        <p className="text-[12px] text-muted text-center">
          New to Shouks?{" "}
          <Link
            href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-blue-ink hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    );
  } else if (isActiveMember) {
    primaryBlock = (
      <div
        className="rounded-[14px] border border-success/30 bg-success-soft/30 shadow-sm p-5 flex items-center gap-3"
        data-testid="cta-member"
      >
        <span className="grid place-items-center h-10 w-10 rounded-full bg-success-soft text-success flex-none">
          <Check size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold">You're a member.</div>
          <div className="text-[12px] text-muted">Jump into the feed.</div>
        </div>
        <Link href={`/m/${mp.slug}/feed`}>
          <Button>Go to feed</Button>
        </Link>
      </div>
    );
  } else if (latestApplication) {
    primaryBlock = (
      <StatusBanner
        slug={mp.slug}
        status={latestApplication.status}
        reviewerNote={latestApplication.reviewerNote}
        rejectionReason={latestApplication.rejectionReason}
      />
    );
  } else if (mp.entryMethod === "PUBLIC") {
    primaryBlock = (
      <div
        className="rounded-[14px] border border-line bg-surface shadow-sm p-5 space-y-4"
        data-testid="cta-join-public"
      >
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.01em]">
            Join <em className="serif italic text-blue-ink">{mp.name}</em>
          </h2>
          <p className="text-[13px] text-muted mt-1">
            Open community — join instantly with one click.
          </p>
        </div>
        <JoinNowButton slug={mp.slug} />
      </div>
    );
  } else {
    primaryBlock = (
      <div
        className="rounded-[14px] border border-line bg-surface shadow-sm p-5 space-y-4"
        data-testid="cta-apply"
      >
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.01em]">
            Apply to <em className="serif italic text-blue-ink">{mp.name}</em>
          </h2>
          <p className="text-[13px] text-muted mt-1">
            ~48h review · free to apply · answer a few questions from the owners.
          </p>
        </div>
        <Link href={`/apply/${mp.slug}`} className="block">
          <Button size="lg" className="w-full">
            Apply to join <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    );
  }

  const ctx = userId ? await getUserContext() : null;
  const unread = userId
    ? await prisma.notification.count({
        where: { userId, readAt: null },
      })
    : 0;

  return (
    <div className="min-h-screen bg-bg-soft">
      {/* Top bar — full Navbar when authed, minimal when not */}
      {userId && ctx ? (
        <Navbar
          user={{
            id: userId,
            name: ctx.user.displayName ?? ctx.user.name,
            image: ctx.user.image,
            email: ctx.user.email,
          }}
          activeMarketplace={{
            id: mp.id,
            name: mp.name,
            slug: mp.slug,
            logoUrl: mp.logoUrl,
            primaryColor: mp.primaryColor,
          }}
          marketplaces={[...ctx.owned, ...ctx.memberships]}
          mode="member"
          notificationCount={unread}
        />
      ) : (
        <header className="bg-surface border-b border-line">
          <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
            <BrandLockup href="/" size={22} />
            <div className="flex items-center gap-2">
              <Link href={`/signin?callbackUrl=/m/${mp.slug}`}>
                <Button size="sm">Log in</Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Cover / hero */}
      <section
        className="w-full h-[180px] sm:h-[220px] relative"
        style={{
          backgroundImage: mp.coverImageUrl
            ? `url(${mp.coverImageUrl})`
            : headerGradient,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
      </section>

      <main className="max-w-[640px] mx-auto px-4 pb-16 -mt-10 relative">
        {/* Identity card */}
        <div className="bg-surface border border-line rounded-[14px] shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span
              className="w-16 h-16 rounded-[14px] grid place-items-center text-white font-semibold text-[26px] flex-none border-4 border-surface shadow-sm -mt-10"
              style={{
                background: mp.primaryColor ?? "var(--blue)",
              }}
            >
              {mp.logoUrl ? (
                <img
                  src={mp.logoUrl}
                  alt=""
                  className="w-full h-full object-cover rounded-[10px]"
                />
              ) : (
                mp.name[0]
              )}
            </span>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant="blue">{mp.category}</Badge>
                {mp.entryMethod === "INVITE" && (
                  <Badge variant="outline">Invite only</Badge>
                )}
              </div>
              <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-tight">
                {mp.name}
              </h1>
              {mp.tagline && (
                <p className="serif italic text-[15px] text-ink-soft mt-1.5">
                  {mp.tagline}
                </p>
              )}
            </div>
          </div>

          {mp.description && (
            <p className="text-[14px] text-ink-soft leading-[1.65] whitespace-pre-line">
              {mp.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 pt-1 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} />
              <span className="tabular-nums text-ink">
                {mp._count.memberships.toLocaleString()}
              </span>{" "}
              members
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Package size={14} />
              <span className="tabular-nums text-ink">
                {mp._count.listings.toLocaleString()}
              </span>{" "}
              listings
            </span>
            <span className="inline-flex items-center gap-1.5">
              Run by <span className="text-ink">{ownerName}</span>
            </span>
          </div>
        </div>

        {/* Primary action */}
        <div className="mt-5">{primaryBlock}</div>

        {/* Requirements teaser */}
        {requirements.length > 0 && !isActiveMember && (
          <section className="mt-6 bg-surface border border-line rounded-[14px] shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-blue-ink" />
              <h3 className="text-[14px] font-semibold">
                Verification requirements
              </h3>
            </div>
            <p className="text-[12px] text-muted mb-3">
              {userId
                ? "Link these accounts before you apply."
                : "These get linked during the application flow."}
            </p>
            <ul className="space-y-2">
              {requirements.map((p) => {
                const covered = verifiedSet.has(p);
                return (
                  <li
                    key={p}
                    className="flex items-center justify-between gap-3 py-1.5"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={
                          "grid place-items-center h-6 w-6 rounded-full flex-none " +
                          (covered
                            ? "bg-success-soft text-success"
                            : "bg-bg-panel text-muted")
                        }
                      >
                        <Check size={12} />
                      </span>
                      <span className="text-[14px] text-ink">
                        {providerLabel(p)}
                      </span>
                    </span>
                    <span
                      className={
                        "text-[12px] " +
                        (covered ? "text-success" : "text-muted")
                      }
                    >
                      {covered ? "Linked" : "Not linked"}
                    </span>
                  </li>
                );
              })}
            </ul>
            {userId && missingRequirements.length > 0 && (
              <div className="mt-4">
                <Link
                  href={`/onboarding/verify?redirect=/apply/${mp.slug}`}
                  className="text-[13px] text-blue-ink hover:underline inline-flex items-center gap-1"
                >
                  Link accounts <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Application questions teaser */}
        {!isActiveMember &&
          !latestApplication &&
          mp.applicationQuestions.length > 0 && (
            <section className="mt-6 bg-surface border border-line rounded-[14px] shadow-sm p-5">
              <h3 className="text-[14px] font-semibold mb-1">
                What owners will ask
              </h3>
              <p className="text-[12px] text-muted mb-3">
                {mp.applicationQuestions.length} question
                {mp.applicationQuestions.length === 1 ? "" : "s"} · takes ~3 min
              </p>
              <ul className="space-y-2.5">
                {mp.applicationQuestions.slice(0, 4).map((q) => (
                  <li
                    key={q.id}
                    className="text-[13px] text-ink-soft pl-3 border-l-2 border-line-soft"
                  >
                    {q.label}
                  </li>
                ))}
                {mp.applicationQuestions.length > 4 && (
                  <li className="text-[12px] text-muted">
                    + {mp.applicationQuestions.length - 4} more
                  </li>
                )}
              </ul>
            </section>
          )}

        <footer className="mt-10 text-center text-[12px] text-muted">
          Powered by{" "}
          <Link href="/" className="hover:text-ink">
            Shouks
          </Link>
        </footer>
      </main>
    </div>
  );
}
