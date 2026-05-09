"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info, Sparkles } from "lucide-react";
import {
  Button,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui";
import { cn, formatCents } from "@/lib/utils";
import { i18n } from '@shipeasy/sdk/client'

export function MonetizationForm({
  slug,
  initial,
}: {
  slug: string;
  initial: {
    isPaid: boolean;
    monthlyPriceCents: number | null;
    annualPriceCents: number | null;
    activeMembers: number;
  };
}) {
  const router = useRouter();
  const [isPaid, setIsPaid] = React.useState(initial.isPaid);
  const [monthly, setMonthly] = React.useState(
    initial.monthlyPriceCents != null
      ? (initial.monthlyPriceCents / 100).toFixed(
          initial.monthlyPriceCents % 100 === 0 ? 0 : 2,
        )
      : "",
  );
  const [annual, setAnnual] = React.useState(
    initial.annualPriceCents != null
      ? (initial.annualPriceCents / 100).toFixed(
          initial.annualPriceCents % 100 === 0 ? 0 : 2,
        )
      : "",
  );
  const [saving, setSaving] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (isPaid) {
      const m = monthly.trim();
      const a = annual.trim();
      if (!m && !a) {
        toast.error(i18n.t('...monetization.monetizationForm.enterAMonthlyOrAnnual'));
        return;
      }
      if (m && !/^\d+(\.\d{1,2})?$/.test(m)) {
        toast.error(i18n.t('...monetization.monetizationForm.monthlyPriceMustBeA'));
        return;
      }
      if (a && !/^\d+(\.\d{1,2})?$/.test(a)) {
        toast.error(i18n.t('...monetization.monetizationForm.annualPriceMustBeA'));
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/marketplaces/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPaid,
          monthlyPriceCents:
            isPaid && monthly.trim()
              ? Math.round(parseFloat(monthly) * 100)
              : null,
          annualPriceCents:
            isPaid && annual.trim() ? Math.round(parseFloat(annual) * 100) : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? i18n.t('...monetization.monetizationForm.couldntSaveMonetization'));
        return;
      }
      toast.success(i18n.t('...monetization.monetizationForm.monetizationSaved'));
      router.refresh();
    } catch {
      toast.error(i18n.t('common.networkErrorPleaseTryAgain'));
    } finally {
      setSaving(false);
    }
  }

  // Revenue estimates (placeholder since we don't have Stripe wiring yet).
  const mrrCents = isPaid && monthly.trim()
    ? Math.round(parseFloat(monthly || "0") * 100) * initial.activeMembers
    : 0;

  return (
    <form onSubmit={save} data-testid="monetization-form" className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{i18n.t('common.membershipPricing')}</CardTitle>
          <CardDescription>{i18n.t('common.freeOrSubscriptionbased')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            role="radiogroup"
            aria-label={i18n.t('common.pricing')}
          >
            <PricingOption
              testid="monetization-free"
              active={!isPaid}
              title={i18n.t('common.free')}
              body="Anyone approved can join at no cost."
              onClick={() => setIsPaid(false)}
            />
            <PricingOption
              testid="monetization-paid"
              active={isPaid}
              title={i18n.t('common.paidMembership')}
              body="Charge monthly, annually, or both."
              onClick={() => setIsPaid(true)}
            />
          </div>

          {isPaid && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-[10px] border border-line-soft bg-bg-panel p-4">
              <div>
                <Label htmlFor="price-monthly">{i18n.t('common.monthlyPriceUsd')}</Label>
                <div className="flex items-stretch rounded-[10px] border border-line bg-surface overflow-hidden focus-within:border-blue focus-within:ring-[3px] focus-within:ring-[var(--blue-softer)]">
                  <span className="inline-flex items-center px-3 text-[13px] text-muted bg-bg-panel border-r border-line select-none">
                    $
                  </span>
                  <input
                    id="price-monthly"
                    inputMode="decimal"
                    data-testid="monetization-monthly"
                    placeholder="9.99"
                    value={monthly}
                    onChange={(e) => setMonthly(e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-transparent text-[14px] outline-none"
                  />
                  <span className="inline-flex items-center px-3 text-[13px] text-muted bg-bg-panel border-l border-line select-none">
                    {i18n.t('...monetization.monetizationForm.perMonth')}
                  </span>
                </div>
              </div>
              <div>
                <Label htmlFor="price-annual">{i18n.t('common.annualPriceUsd')}</Label>
                <div className="flex items-stretch rounded-[10px] border border-line bg-surface overflow-hidden focus-within:border-blue focus-within:ring-[3px] focus-within:ring-[var(--blue-softer)]">
                  <span className="inline-flex items-center px-3 text-[13px] text-muted bg-bg-panel border-r border-line select-none">
                    $
                  </span>
                  <input
                    id="price-annual"
                    inputMode="decimal"
                    data-testid="monetization-annual"
                    placeholder="99.00"
                    value={annual}
                    onChange={(e) => setAnnual(e.target.value)}
                    className="flex-1 h-[38px] px-3 bg-transparent text-[14px] outline-none"
                  />
                  <span className="inline-flex items-center px-3 text-[13px] text-muted bg-bg-panel border-l border-line select-none">
                    {i18n.t('...monetization.monetizationForm.perYear')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            type="submit"
            variant="primary"
            data-testid="monetization-save"
            disabled={saving}
          >
            {saving ? i18n.t('common.saving') : i18n.t('...monetization.monetizationForm.saveMonetization')}
          </Button>
        </CardFooter>
      </Card>

      {isPaid && (
        <Card>
          <CardHeader>
            <CardTitle>{i18n.t('common.revenue')}</CardTitle>
            <CardDescription>
              {i18n.t('...monetization.monetizationForm.estimatedFromActivePayingMembers')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Stat
                testid="monetization-active-members"
                label={i18n.t('...monetization.monetizationForm.activePayingMembers')}
                value={initial.activeMembers.toLocaleString()}
              />
              <Stat
                testid="monetization-mrr"
                label={i18n.t('...monetization.monetizationForm.mrr')}
                value={formatCents(mrrCents)}
              />
              <Stat
                testid="monetization-churn"
                label={i18n.t('...monetization.monetizationForm.churn')}
                value="—"
                hint={i18n.t('common.comingSoon')}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{i18n.t('common.payouts')}</CardTitle>
          <CardDescription>
            {i18n.t('...monetization.monetizationForm.connectStripeToReceiveSubscription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-between gap-3 rounded-[10px] border border-line-soft bg-bg-panel px-4 py-3"
            title={i18n.t('...monetization.monetizationForm.mvpPlaceholderStripeWiringShips')}
          >
            <div className="flex items-start gap-2 min-w-0">
              <Sparkles size={16} className="text-blue-ink mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[14px] font-medium">{i18n.t('...monetization.monetizationForm.stripe')}</div>
                <div className="text-[12.5px] text-muted">
                  {i18n.t('...monetization.monetizationForm.mvpPlaceholderNotYetWired')}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              data-testid="monetization-connect-stripe"
              onClick={() =>
                toast("Stripe connect is an MVP placeholder — ships soon.", {
                  icon: <Info size={14} />,
                })
              }
            >
              {i18n.t('...monetization.monetizationForm.connectStripe')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function PricingOption({
  active,
  title,
  body,
  onClick,
  testid,
}: {
  active: boolean;
  title: string;
  body: string;
  onClick: () => void;
  testid: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      data-testid={testid}
      onClick={onClick}
      className={cn(
        "text-left rounded-[10px] border p-4 transition",
        active
          ? "border-blue bg-blue-soft ring-[3px] ring-[var(--blue-softer)]"
          : "border-line bg-surface hover:bg-hover",
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[14px] font-semibold">{title}</span>
        <span
          className={cn(
            "h-4 w-4 rounded-full border-2",
            active ? "border-blue bg-blue" : "border-line",
          )}
          aria-hidden
        >
          {active && <span className="block h-full w-full rounded-full bg-white scale-50" />}
        </span>
      </div>
      <p className="text-[12.5px] text-muted">{body}</p>
    </button>
  );
}

function Stat({
  label,
  value,
  hint,
  testid,
}: {
  label: string;
  value: string;
  hint?: string;
  testid: string;
}) {
  return (
    <div
      className="rounded-[10px] border border-line bg-surface p-4"
      data-testid={testid}
    >
      <div className="text-[12px] uppercase tracking-[0.14em] text-muted font-semibold">
        {label}
      </div>
      <div className="text-[24px] font-semibold tracking-[-0.01em] tabular-nums mt-1">
        {value}
      </div>
      {hint && <div className="text-[12px] text-muted mt-1">{hint}</div>}
    </div>
  );
}
