import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Search, FileText, Gavel, Users, FileStack, CircleDollarSign } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/Button";
import { ShouksMark } from "@/components/brand/Logo";
import { prisma } from "@/lib/prisma";
import { i18n } from '@shipeasy/sdk/client'

export const dynamic = "force-dynamic";

async function getFeatured() {
  try {
    return await prisma.marketplace.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        _count: { select: { memberships: true, listings: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  // If the visitor is already signed in, don't show the marketing landing —
  // their session should persist and drop them straight into the app (SHK-029).
  const session = await auth();
  if (session?.user?.id) {
    redirect("/home");
  }

  const featured = await getFeatured();

  return (
    <div className="bg-[oklch(0.985_0.004_230)]">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-line">
        <div className="shell flex items-center justify-between h-16">
          <Link href="/" className="inline-flex items-center gap-[10px] font-semibold text-ink text-[18px]" style={{ letterSpacing: "-0.02em" }}>
            <ShouksMark size={28} />
            <span>{i18n.t('common.shouks')}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label={i18n.t('...app.page.primaryAria-label')}>
            <a href="#how" className="px-3 py-2 rounded-lg text-[14px] text-ink-soft hover:bg-hover hover:text-ink">{i18n.t('...app.page.howItWorks')}</a>
            <a href="#sides" className="px-3 py-2 rounded-lg text-[14px] text-ink-soft hover:bg-hover hover:text-ink">{i18n.t('...app.page.whyShouks')}</a>
            <Link href="/explore" className="px-3 py-2 rounded-lg text-[14px] text-ink-soft hover:bg-hover hover:text-ink">{i18n.t('...app.page.explore')}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/signin">
              <Button variant="dark" size="md">{i18n.t('common.logIn')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line py-16 md:py-24">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-90"
          style={{
            backgroundImage:
              "linear-gradient(var(--line-soft) 1px, transparent 1px), linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 40%, #000 0%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, #000 0%, transparent 72%)",
          }}
        />
        <div className="shell relative text-center max-w-[820px]">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-line text-[12px] text-ink-soft font-medium shadow-sm mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-blue" style={{ boxShadow: "0 0 0 4px var(--blue-softer)" }} />
            {i18n.t('...app.page.aHomeForCommunitiesBuilt')}
          </span>
          <h1 className="text-[clamp(40px,6.2vw,72px)] font-semibold leading-[1.02] tracking-[-0.035em] mb-5">
            {i18n.t('...app.page.whereCommunities')}<br />
            {i18n.t('...app.page.runTheir')} <span className="serif italic text-blue inline-block px-0.5">own markets.</span>
          </h1>
          <div className="mb-7" aria-hidden />
          <div className="inline-flex gap-2.5 flex-wrap justify-center">
            <Link href="/signin"><Button variant="primary" size="lg" className="gap-1.5">{i18n.t('...app.page.getStarted')} <ArrowRight size={16} /></Button></Link>
            <Link href="/explore"><Button variant="secondary" size="lg">{i18n.t('...app.page.browseMarketplaces')}</Button></Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-9 text-[13px] text-muted">
            <span>{i18n.t('...app.page.freeToJoin')}</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-40" />
            <span>{i18n.t('...app.page.verifiedMembers')}</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-40" />
            <span className="hidden sm:inline">{i18n.t('...app.page.yourRulesYourCommunity')}</span>
          </div>
        </div>
      </section>

      {/* TWO SIDES */}
      <section id="sides" className="py-24">
        <div className="shell">
          <div className="text-center max-w-[680px] mx-auto mb-14">
            <div className="text-[12px] tracking-[0.14em] uppercase text-blue-ink font-semibold mb-3.5">{i18n.t('...app.page.twoSidesOneAccount')}</div>
            <h2 className="text-[clamp(30px,3.8vw,44px)] leading-[1.08] tracking-[-0.03em] mb-3.5">{i18n.t('...app.page.buyAndSellWithPeople')}</h2>
            <p className="text-ink-soft text-[17px] leading-[1.55]">{i18n.t('...app.page.everyShouksAccountCanBrowse')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* JOIN */}
            <div className="bg-surface border border-line rounded-xl p-9 transition-all hover:-translate-y-0.5 hover:shadow">
              <div className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft mb-4">
                <span className="w-5 h-5 rounded-[5px] grid place-items-center bg-blue text-white text-[11px]">1</span>
                {i18n.t('...app.page.joinACommunity')}
              </div>
              <h3 className="text-[28px] tracking-[-0.028em] leading-[1.1] mb-3">{i18n.t('...app.page.findThePeopleWhoKnow')}</h3>
              <p className="text-ink-soft text-[15px] leading-[1.55] mb-5">{i18n.t('...app.page.everyMarketplaceIsCuratedApply')}</p>
              <ul className="space-y-3.5 mb-7">
                <li className="flex gap-3 text-[14px] leading-[1.5]"><Search size={18} className="text-blue flex-none mt-0.5" /> {i18n.t('...app.page.searchByWhatActuallyMatters')}</li>
                <li className="flex gap-3 text-[14px] leading-[1.5]"><FileText size={18} className="text-blue flex-none mt-0.5" /> {i18n.t('...app.page.saveSearchesGetPingedThe')}</li>
                <li className="flex gap-3 text-[14px] leading-[1.5]"><Gavel size={18} className="text-blue flex-none mt-0.5" /> {i18n.t('...app.page.bidLiveInOpenAuctions')}</li>
              </ul>
              <div className="flex items-center gap-3.5 pt-5 border-t border-line">
                <Link href="/explore"><Button variant="primary">{i18n.t('common.exploreMarketplaces')}</Button></Link>
                <span className="text-[13px] text-muted">{i18n.t('...app.page.freeToJoin')}</span>
              </div>
            </div>

            {/* CREATE */}
            <div className="bg-surface border border-line rounded-xl p-9 transition-all hover:-translate-y-0.5 hover:shadow">
              <div className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase font-semibold text-ink-soft mb-4">
                <span className="w-5 h-5 rounded-[5px] grid place-items-center bg-ink text-white text-[11px]">2</span>
                {i18n.t('...app.page.runYourOwn')}
              </div>
              <h3 className="text-[28px] tracking-[-0.028em] leading-[1.1] mb-3">{i18n.t('...app.page.spinUpAMarketplaceFor')}</h3>
              <p className="text-ink-soft text-[15px] leading-[1.55] mb-5">{i18n.t('...app.page.bringYourWhatsappGroupFacebook')}</p>
              <ul className="space-y-3.5 mb-7">
                <li className="flex gap-3 text-[14px] leading-[1.5]"><FileStack size={18} className="text-ink-soft flex-none mt-0.5" /> {i18n.t('...app.page.buildTheListingFormYourself')}</li>
                <li className="flex gap-3 text-[14px] leading-[1.5]"><Users size={18} className="text-ink-soft flex-none mt-0.5" /> {i18n.t('...app.page.decideWhoGetsInApplications')}</li>
                <li className="flex gap-3 text-[14px] leading-[1.5]"><CircleDollarSign size={18} className="text-ink-soft flex-none mt-0.5" /> {i18n.t('...app.page.chargeAMembershipFeeIf')}</li>
              </ul>
              <div className="flex items-center gap-3.5 pt-5 border-t border-line">
                <Link href="/owner/create"><Button variant="dark">{i18n.t('...app.page.startAMarketplace')}</Button></Link>
                <span className="text-[13px] text-muted">{i18n.t('...app.page.under10Minutes')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-16">
        <div className="shell">
          <div className="text-center max-w-[680px] mx-auto mb-14">
            <div className="text-[12px] tracking-[0.14em] uppercase text-blue-ink font-semibold mb-3.5">{i18n.t('...app.page.howItWorks')}</div>
            <h2 className="text-[clamp(30px,3.8vw,44px)] leading-[1.08] tracking-[-0.03em] mb-3.5">{i18n.t('...app.page.simpleEnoughToLaunchToday')}</h2>
            <p className="text-ink-soft text-[17px] leading-[1.55]">{i18n.t('...app.page.whetherYoureJoiningSomeoneElses')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { n: "01", t: "Create an account", p: "Sign up once with your email or Google. Verify your identity with the accounts you already use — Facebook, Instagram, LinkedIn, or phone." },
              { n: "02", t: "Join, or create", p: "Apply to marketplaces that match what you collect, trade, or follow. Or define your own — name it, brand it, decide who gets in." },
              { n: "03", t: "Start transacting", p: "List items using the community's form. Bid on auctions. Contact sellers directly. Deals happen between members — Shouks stays out of the way." },
            ].map((s) => (
              <div key={s.n} className="bg-surface border border-line rounded-xl p-7">
                <div className="serif italic text-blue text-[44px] leading-none tracking-[-0.04em] mb-5">{s.n}</div>
                <h4 className="text-[18px] tracking-[-0.02em] mb-2">{s.t}</h4>
                <p className="text-[14px] text-ink-soft leading-[1.55]">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-12">
        <div className="shell">
          <div className="bg-ink text-[oklch(0.94_0.005_240)] rounded-[20px] p-10 md:p-14">
            <div className="grid md:grid-cols-[1.1fr_1fr] gap-10 md:gap-12 items-center">
              <div>
                <div className="text-[12px] tracking-[0.14em] uppercase text-[oklch(0.78_0.08_242)] font-semibold mb-3.5">{i18n.t('...app.page.trustLivesAtTheDoor')}</div>
                <h2 className="text-[clamp(28px,3.4vw,40px)] tracking-[-0.03em] leading-[1.1] mb-4.5 text-white">{i18n.t('...app.page.everyMemberGetsTheSame')}</h2>
                <p className="text-[oklch(0.84_0.015_240)] text-[16px] leading-[1.6] max-w-[440px]">{i18n.t('...app.page.anonymousMarketplacesFillUpWith')}</p>
              </div>
              <div className="grid gap-2.5 bg-[oklch(0.22_0.022_240)] border border-[oklch(0.3_0.02_240)] rounded-[14px] p-5">
                {[
                  { badge: "f", bg: "#1877f2", label: i18n.t('...app.page.facebookLinked') },
                  { badge: "IG", bg: "linear-gradient(135deg, #f58529, #dd2a7b, #515bd4)", label: i18n.t('...app.page.instagramLinked') },
                  { badge: "in", bg: "#0a66c2", label: i18n.t('...app.page.linkedinLinked') },
                  { badge: "☎︎", bg: "oklch(0.3 0.02 240)", label: i18n.t('...app.page.phone14154912') },
                ].map((v) => (
                  <div key={v.label} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[8px] bg-[oklch(0.18_0.02_240)]">
                    <div className="flex items-center gap-2.5 text-[oklch(0.92_0.005_240)] text-[13px]">
                      <span className="w-7 h-7 rounded-[7px] grid place-items-center text-[13px] font-semibold text-white" style={{ background: v.bg }}>{v.badge}</span>
                      <span>{v.label}</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[oklch(0.78_0.13_160)] text-[12px] font-medium">
                      <span className="w-2 h-2 rounded-full bg-[oklch(0.72_0.15_160)]" style={{ boxShadow: "0 0 0 3px oklch(0.72 0.15 160 / 0.18)" }} />
                      {i18n.t('common.verified')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-12">
        <div className="shell">
          <div className="text-center max-w-[680px] mx-auto mb-14">
            <div className="text-[12px] tracking-[0.14em] uppercase text-blue-ink font-semibold mb-3.5">{i18n.t('...app.page.communitiesOnShouks')}</div>
            <h2 className="text-[clamp(30px,3.8vw,44px)] leading-[1.08] tracking-[-0.03em] mb-3.5">{i18n.t('...app.page.smallVettedAndReal')}</h2>
            <p className="text-ink-soft text-[17px] leading-[1.55]">{i18n.t('...app.page.wereJustGettingStartedHeres')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.length === 0 && (
              <>
                {[
                  { slug: "ferrari-frenzy", name: "Ferrari Frenzy", cat: "Vehicles", members: 128, listings: 24, gradient: "linear-gradient(135deg, oklch(0.48 0.2 28), oklch(0.26 0.14 25))", entry: "Application", label: i18n.t('...app.page.collectorVehicles') },
                  { slug: "gooners-united", name: "Gooners United", cat: "Memorabilia", members: 42, listings: 7, gradient: "linear-gradient(135deg, oklch(0.52 0.18 25), oklch(0.3 0.12 25))", entry: "Invite only", label: i18n.t('...app.page.footballMemorabilia') },
                ].map((m) => (
                  <Link key={m.slug} href={`/m/${m.slug}`} className="bg-surface border border-line rounded-xl overflow-hidden transition hover:-translate-y-0.5 hover:shadow">
                    <div className="relative h-[132px]" style={{ background: m.gradient }}>
                      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,.45) 100%)" }} />
                      <div className="absolute top-3 left-3 mono text-[10px] tracking-[0.08em] uppercase text-white/60">&lt;-- {m.label} --&gt;</div>
                      <div className="absolute bottom-3 left-3.5 right-3.5 text-white font-semibold text-[16px] tracking-[-0.015em]">{m.name}</div>
                    </div>
                    <div className="p-4 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center text-[13px] text-ink-soft">
                        <span className="text-[12px] text-muted">{m.cat}</span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-soft text-blue-ink">{m.entry}</span>
                      </div>
                      <div className="flex gap-3.5 text-[12px] text-muted">
                        <span>{m.members} members</span>
                        <span>{m.listings} listings</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}
            {featured.map((m) => (
              <Link key={m.id} href={`/m/${m.slug}`} className="bg-surface border border-line rounded-xl overflow-hidden transition hover:-translate-y-0.5 hover:shadow">
                <div className="relative h-[132px]" style={{ background: m.coverImageUrl ? `url(${m.coverImageUrl})` : `linear-gradient(135deg, var(--blue), var(--blue-ink))`, backgroundSize: "cover", backgroundPosition: "center" }}>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,.45) 100%)" }} />
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white font-semibold text-[16px] tracking-[-0.015em]">{m.name}</div>
                </div>
                <div className="p-4 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-[13px] text-ink-soft">
                    <span className="text-[12px] text-muted">{m.category}</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-soft text-blue-ink capitalize">{m.entryMethod.toLowerCase()}</span>
                  </div>
                  <div className="flex gap-3.5 text-[12px] text-muted">
                    <span>{m._count.memberships} members</span>
                    <span>{m._count.listings} listings</span>
                  </div>
                </div>
              </Link>
            ))}

            <Link href="/owner/create" className="grid place-items-center bg-surface border border-dashed border-[oklch(0.85_0.008_240)] rounded-xl min-h-[228px] text-center p-5">
              <div>
                <div className="mono text-[11px] uppercase tracking-[0.12em] text-muted mb-2">{i18n.t('...app.page.yourCommunity')}--&gt;</div>
                <div className="text-[13px] text-ink-soft max-w-[200px] mb-4">{i18n.t('...app.page.thisCouldBeYourWatch')}</div>
                <Button variant="secondary">{i18n.t('...app.page.startOne')}</Button>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="pt-12 pb-0">
        <div className="shell">
          <div className="text-center bg-[var(--blue-softer)] border border-[oklch(0.91_0.03_240)] rounded-[20px] py-16 md:py-20 px-8">
            <h2 className="text-[clamp(32px,4vw,48px)] tracking-[-0.03em] leading-[1.05] mb-3.5">{i18n.t('...app.page.readyWhenYouAre')}</h2>
            <p className="text-ink-soft text-[17px] mb-7">{i18n.t('...app.page.oneAccountJoinTheCommunities')}</p>
            <div className="inline-flex gap-2.5 flex-wrap justify-center">
              <Link href="/signin"><Button variant="primary" size="lg" className="gap-2">{i18n.t('common.createYourAccount')} <ArrowRight size={16} /></Button></Link>
              <Link href="/explore"><Button variant="secondary" size="lg">{i18n.t('...app.page.browseFirst')}</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 mt-24 border-t border-line">
        <div className="shell flex flex-col sm:flex-row items-center justify-between gap-4 text-muted text-[13px]">
          <div className="inline-flex items-center gap-2.5 text-[14px]">
            <ShouksMark size={22} />
            <span>{i18n.t('...app.page.shouks2026')}</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-ink">{i18n.t('common.privacy')}</Link>
            <Link href="/terms" className="hover:text-ink">{i18n.t('common.terms')}</Link>
            <Link href="/help" className="hover:text-ink">{i18n.t('common.help')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
