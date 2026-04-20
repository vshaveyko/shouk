import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserContext } from "@/lib/auth-helpers";
import { Navbar } from "@/components/app/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { verifyProviders } from "@/lib/utils";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your profile" };

function providerLabel(p: string) {
  return verifyProviders.find((v) => v.id === p)?.label ?? p;
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/profile");

  const ctx = await getUserContext();
  if (!ctx) redirect("/signin?callbackUrl=/profile");

  const { user, memberships, owned } = ctx;
  const active = memberships[0] ?? owned[0] ?? null;

  const unread = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  const [listingCount, saveCount] = await Promise.all([
    prisma.listing.count({ where: { sellerId: user.id } }),
    prisma.listingSave.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="min-h-screen bg-bg-soft">
      <Navbar
        user={{ id: user.id, name: user.displayName ?? user.name, image: user.image, email: user.email }}
        activeMarketplace={active}
        marketplaces={[...owned, ...memberships]}
        mode="member"
        notificationCount={unread}
      />

      <main className="max-w-[860px] mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-[12px] tracking-[0.14em] uppercase text-blue-ink font-semibold mb-2">Account</p>
          <h1 className="text-[32px] font-semibold tracking-[-0.02em]">Your profile</h1>
          <p className="text-[14px] text-muted mt-1.5">
            This is how other members see you across Shouks.
          </p>
        </div>

        {/* Identity card */}
        <section className="bg-surface border border-line rounded-[14px] p-6 mb-6">
          <div className="flex items-start gap-4">
            <Avatar src={user.image} name={user.displayName ?? user.name} size={72} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-[20px] font-semibold truncate" data-testid="profile-display-name">
                  {user.displayName ?? user.name ?? "You"}
                </h2>
                {user.verifiedAccounts.length > 0 && (
                  <CheckCircle2 size={16} className="text-blue flex-none" aria-label="Verified" />
                )}
              </div>
              <div className="text-[13px] text-muted">{user.email}</div>
              <div className="flex flex-wrap gap-4 mt-3 text-[12px] text-muted">
                <span><span className="tabular-nums text-ink">{listingCount}</span> listing{listingCount === 1 ? "" : "s"}</span>
                <span><span className="tabular-nums text-ink">{saveCount}</span> saved</span>
                <span><span className="tabular-nums text-ink">{memberships.length}</span> membership{memberships.length === 1 ? "" : "s"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bio form */}
        <ProfileForm
          initialDisplayName={user.displayName ?? user.name ?? ""}
          initialBio={user.bio ?? ""}
        />

        {/* Verified accounts */}
        <section className="bg-surface border border-line rounded-[14px] p-6 mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-ink" />
              <h2 className="text-[16px] font-semibold">Verified accounts</h2>
            </div>
            <Link
              href="/onboarding/verify"
              className="text-[13px] text-blue-ink hover:underline inline-flex items-center gap-1"
              data-testid="verify-accounts"
            >
              Manage <ArrowRight size={13} />
            </Link>
          </div>
          {user.verifiedAccounts.length === 0 && !user.phoneVerified ? (
            <p className="text-[14px] text-muted">
              You haven't linked any accounts. Most marketplaces require at least one.
            </p>
          ) : (
            <ul className="space-y-2">
              {user.verifiedAccounts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-[10px] bg-bg-soft border border-line-soft"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-[7px] grid place-items-center bg-blue-soft text-blue-ink font-semibold text-[12px]">
                      {providerLabel(a.provider)[0]}
                    </span>
                    <div>
                      <div className="text-[13px] font-medium">{providerLabel(a.provider)}</div>
                      <div className="text-[11px] text-muted">{a.handle}</div>
                    </div>
                  </div>
                  <Badge variant="approved">Verified</Badge>
                </li>
              ))}
              {user.phoneVerified && (
                <li className="flex items-center justify-between px-3 py-2.5 rounded-[10px] bg-bg-soft border border-line-soft">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-[7px] grid place-items-center bg-blue-soft text-blue-ink font-semibold text-[12px]">
                      ☎
                    </span>
                    <div>
                      <div className="text-[13px] font-medium">Phone</div>
                      <div className="text-[11px] text-muted">{user.phoneNumber}</div>
                    </div>
                  </div>
                  <Badge variant="approved">Verified</Badge>
                </li>
              )}
            </ul>
          )}
        </section>

        {/* Memberships */}
        {(memberships.length > 0 || owned.length > 0) && (
          <section className="bg-surface border border-line rounded-[14px] p-6 mt-6">
            <h2 className="text-[16px] font-semibold mb-3">Your communities</h2>
            <ul className="space-y-2">
              {[...owned.map((m) => ({ ...m, role: "Owner" as const })), ...memberships.map((m) => ({ ...m, role: "Member" as const }))].map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/m/${m.slug}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-hover transition-colors"
                  >
                    <span
                      className="w-9 h-9 rounded-[10px] grid place-items-center text-white font-semibold text-[14px] flex-none"
                      style={{ background: m.primaryColor ?? "var(--blue)" }}
                    >
                      {m.name[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium truncate">{m.name}</div>
                      <div className="text-[12px] text-muted">{m.category} · {m.role}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
